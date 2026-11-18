"""Real relief -> voxel heightmaps for the Remotion/three.js world.

Input : SRTM 1" tiles (data/raw/N41E044.hgt, N42E044.hgt), OSM Mtkvari geometry (data/raw/mtkvari.json),
        geocoded landmarks (data/raw/landmarks_nominatim.json).
Output: video/public/terrain/<name>.bin  (uint16 heights in decimetres, row-major, north row first)
        video/public/terrain/<name>.json (grid, block size, river polylines and landmarks in local metres)

Local frame: x = east (m), z = south (m), origin = centre of the box. 1 cell = CELL metres.
Modern buildings in the SRTM surface are suppressed with a grey-scale morphological opening (r = OPEN_R m)
plus a light Gaussian blur; the river corridor is carved to the water level taken from the DEM itself.

Usage: python3 tools/terrain.py
"""
import json
import math
import os

import numpy as np
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")
OUT = os.path.join(ROOT, "video", "public", "terrain")
R_EARTH = 6371008.8

REGIONS = {
    # Krtsanisi field (incl. Krtsanisi village on the Mtkvari) + old Tbilisi (Narikala, Metekhi), ~14.1 x 11.9 km
    "tbilisi": dict(tile="N41E044", lat=(41.598, 41.705), lon=(44.780, 44.950), cell=10.0, open_r=40.0, river="mtkvari.json"),
    # Aragvi valley north of Ananuri and the modern Zhinvali reservoir, ~6 x 6 km (intro)
    "aragvi": dict(tile="N42E044", lat=(42.215, 42.269), lon=(44.660, 44.733), cell=10.0, open_r=0.0, river=None, thalweg=True),
}


def read_hgt(name):
    a = np.fromfile(os.path.join(RAW, name + ".hgt"), dtype=">i2")
    n = int(math.isqrt(a.size))
    a = a.reshape(n, n).astype(np.float32)
    a[a < -1000] = np.nan
    if np.isnan(a).any():                       # fill voids with nearest valid value
        idx = ndimage.distance_transform_edt(np.isnan(a), return_distances=False, return_indices=True)
        a = a[tuple(idx)]
    return a, n


def sample_region(spec):
    dem, n = read_hgt(spec["tile"])
    lat0t, lon0t = float(spec["tile"][1:3]), float(spec["tile"][4:7])
    (la0, la1), (lo0, lo1) = spec["lat"], spec["lon"]
    latc, lonc = (la0 + la1) / 2, (lo0 + lo1) / 2
    mlat = math.pi / 180 * R_EARTH
    mlon = mlat * math.cos(math.radians(latc))
    W = (lo1 - lo0) * mlon; H = (la1 - la0) * mlat
    cell = spec["cell"]
    nx, nz = int(W // cell), int(H // cell)
    xs = (np.arange(nx) + 0.5) * cell - W / 2
    zs = (np.arange(nz) + 0.5) * cell - H / 2
    X, Z = np.meshgrid(xs, zs)
    lat = latc - Z / mlat
    lon = lonc + X / mlon
    # row 0 of the hgt is the north edge (lat0t + 1)
    r = (lat0t + 1 - lat) * (n - 1)
    c = (lon - lon0t) * (n - 1)
    h = ndimage.map_coordinates(dem, [r, c], order=1, mode="nearest")
    to_local = lambda la, lo: ((lo - lonc) * mlon, (latc - la) * mlat)
    return h, dict(nx=nx, nz=nz, cell=cell, width=W, height=H, lat_c=latc, lon_c=lonc), to_local


def carve_river(h, meta, to_local, river_file):
    d = json.load(open(os.path.join(RAW, river_file)))
    lines = [[to_local(la, lo) for la, lo in w["coords"]] for w in d["ways"]]
    cell, nx, nz = meta["cell"], meta["nx"], meta["nz"]
    mask = np.zeros((nz, nx), bool)
    for pts in lines:
        for (x0, z0), (x1, z1) in zip(pts[:-1], pts[1:]):
            steps = int(max(abs(x1 - x0), abs(z1 - z0)) / (cell * 0.5)) + 1
            for t in np.linspace(0, 1, steps):
                i = int((z0 + (z1 - z0) * t + meta["height"] / 2) / cell)
                j = int((x0 + (x1 - x0) * t + meta["width"] / 2) / cell)
                if 0 <= i < nz and 0 <= j < nx:
                    mask[i, j] = True
    dist = ndimage.distance_transform_edt(~mask) * cell
    water = dist < 38                           # Mtkvari ~60-90 m wide through Tbilisi
    # water level: the low percentile of the DEM along the centreline, smoothed downstream
    lvl = ndimage.minimum_filter(np.where(mask, h, 1e4), size=25)
    lvl = np.where(lvl > 5e3, np.nan, lvl)
    idx = ndimage.distance_transform_edt(np.isnan(lvl), return_distances=False, return_indices=True)
    lvl = ndimage.gaussian_filter(lvl[tuple(idx)], 12)
    bank = np.clip((dist - 38) / 70, 0, 1)      # soft banks
    h = np.where(water, lvl - 3, np.minimum(h, lvl + (h - lvl).clip(0) * bank + 1.5 * bank))
    return h, water, lvl, lines


EXTRA_MARKS = {
    # OSM node place=village "კრწანისი" (Overpass, 2026-11-10)
    "Krtsanisi village": {"lat": 41.6106, "lon": 44.9046, "osm": "node place=village"},
    # Wikipedia infobox coordinates of the battle (41°36'35"N 44°54'10"E)
    "Battle coordinates (Wikipedia)": {"lat": 41.60972, "lon": 44.90278, "osm": "-"},
}


def thalweg(h, meta, width=16.0):
    """Valley floor line, one point per row (the river runs roughly N-S), smoothed; carves a stream."""
    sm = ndimage.gaussian_filter(h, 6)
    cols = np.argmin(sm, axis=1).astype(float)
    cols = ndimage.median_filter(cols, 31)
    cols = ndimage.gaussian_filter1d(cols, 8)
    cell = meta["cell"]
    pts = [((c + 0.5) * cell - meta["width"] / 2, (i + 0.5) * cell - meta["height"] / 2) for i, c in enumerate(cols)][::4]
    J = np.arange(meta["nx"])[None, :]
    dist = np.abs(J - cols[:, None]) * cell
    lvl = ndimage.gaussian_filter1d(np.array([h[i, int(c)] for i, c in enumerate(cols)]), 10)[:, None]
    water = dist < width / 2
    bank = np.clip((dist - width / 2) / 60, 0, 1)
    h = np.where(water, lvl - 2, np.minimum(h, lvl + (h - lvl).clip(0) * bank + 1.0 * bank))
    return h, water, np.broadcast_to(lvl, h.shape), [pts]


def main():
    os.makedirs(OUT, exist_ok=True)
    marks = json.load(open(os.path.join(RAW, "landmarks_nominatim.json")))
    marks.update(EXTRA_MARKS)
    for name, spec in REGIONS.items():
        h, meta, to_local = sample_region(spec)
        raw = h.copy()
        if spec["open_r"] > 0:
            k = int(spec["open_r"] / spec["cell"]) * 2 + 1
            h = ndimage.grey_opening(h, size=(k, k))
        h = ndimage.gaussian_filter(h, 1.0)
        rivers, water, lvl = [], np.zeros_like(h, bool), None
        if spec["river"]:
            h, water, lvl, rivers = carve_river(h, meta, to_local, spec["river"])
        elif spec.get("thalweg"):
            h, water, lvl, rivers = thalweg(h, meta)
        base = float(np.floor(h.min() - 4))
        meta.update(dict(
            name=name, base_elev_m=base, vertical_exaggeration=1.5,
            min_elev_m=float(h.min()), max_elev_m=float(h.max()),
            removed_by_opening_m=dict(mean=float((raw - h)[~water].mean()), p99=float(np.percentile((raw - h)[~water], 99))),
            rivers=[[[round(x, 1), round(z, 1)] for x, z in pts] for pts in rivers],
            water_level_m=None if lvl is None else float(np.median(lvl[water])),
            landmarks={k: dict(zip(("x", "z"), map(lambda v: round(v, 1), to_local(v["lat"], v["lon"]))), osm=v["osm"]) for k, v in marks.items()} if name == "tbilisi" else {},
            source=f"SRTM 1 arc-second ({spec['tile']}), via AWS Terrain Tiles 'skadi'",
        ))
        dm = np.clip((h - base) * 10, 0, 65535).astype("<u2")
        dm.tofile(os.path.join(OUT, name + ".bin"))
        wm = water.astype(np.uint8)
        wm.tofile(os.path.join(OUT, name + "_water.bin"))
        # distance to water (m), for land-use rules (floodplain gardens, poplars, banks)
        dw = ndimage.distance_transform_edt(~water) * spec["cell"] if water.any() else np.full(water.shape, 9999.0)
        np.clip(dw, 0, 65535).astype("<u2").tofile(os.path.join(OUT, name + "_dist.bin"))
        json.dump(meta, open(os.path.join(OUT, name + ".json"), "w"), ensure_ascii=False)
        print(name, meta["nx"], "x", meta["nz"], f"elev {meta['min_elev_m']:.0f}-{meta['max_elev_m']:.0f} m",
              "opening removed mean/p99:", meta["removed_by_opening_m"])


if __name__ == "__main__":
    main()
