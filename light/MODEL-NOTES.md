# Spherical spectral transport audit — 2026-10-30

The active sky scene now uses `sky-worker.js` / `transfer.js`, rather than the
legacy single-scattering function in `atmosphere.js`. Other experiments retain
their existing interfaces. The old single-scattering API remains for comparison.

## Numerical checks

- Independent ray quadrature vs scalar Monte Carlo at 440, 550 and 680 nm.
- 64 vs 256 quadrature intervals at solar/view elevations 0, 2 and 30/45 degrees.
- Vacuum, absorption-only medium, nonnegative higher orders, fixed Earth/Mars g.
- Independent all-order prototype vs current scalar transport (150,000 paths).
- Spectral shared-path likelihood tracking vs scalar transport (100,000 paths).
- Outward transmittance lookup vs 128-step direct integration: absolute
  transmittance discrepancy <0.005 in the tested Earth and Mars grid; outward
  rays originating at the top boundary transmit fully.
- Spectral source quadrature sums to one over 380–780 nm; plotted spectral
  densities divide each integrated band by its quadrature width.
- Main-thread changes cancel stale workers, disable recording while computing,
  clear stale spectra, and reuse the scene grid when only the selected sky
  direction changes. Exposure and plot choice do not change physical spectra.

## Rendering and limitations

The single-order angular grid is refined around the Sun. Higher orders use
1024 spectral paths per coarse angular knot; the selected spectrum uses 4096.
All wavelengths share geometry but retain separate likelihood ratios for real,
null and directional events. This prevents independent colour noise; finite
sampling and spatial interpolation errors remain. A variance-guided neighbouring-direction filter is applied only to noisy higher-order display samples, using identical weights for all spectral bands; selected spectra remain unfiltered. The reported integral error
is the sum of per-band standard errors, a conservative bound with spectral
correlations, not an estimate of all model errors.

Solar transmittance uses a lookup on the outward hemisphere and direct
spherical integration for inward rays. The camera tone curve uses one common
linear-channel gain; automatic adaptation is global over the displayed frame.
Use fixed exposure for inter-atmosphere brightness comparisons.

The model is not a calibrated reproduction of a particular rover image. It
omits refraction, clouds, polarization and gas absorption other than ozone.
Published spherical-grain Mie data can overestimate antisolar backscattering.
No manual blue region or antisolar light source is painted into the sky.

## Provenance

See `provenance.json` and `OPTICAL-DATA-NOTICE.txt`. Reference:
https://doi.org/10.1111/cgf.15010 . Data: CosmoScout VR / DLR, realistic Mars
optical tables and Earth ozone, CC0-1.0. Numerical transport background:
https://pbr-book.org/4ed/Light_Transport_II_Volume_Rendering .

## Solar camera and reading layout update (2026-10-30)

A directional diagnostic at a 2° solar elevation with the default Mars optical
set gives linear RGB B/R about 1.6 on-axis; the warm surround already dominates
at roughly 5–10°. This establishes that a blue forward region is present in the
calculated spectrum; it does not establish agreement with a specific rover
image's angular width, camera response or dust conditions.

The full sky is now tabulated in absolute relative azimuth (0–180°), exploiting
reflection symmetry about the solar vertical plane in the spherical medium.
Two simultaneous renderings sample this one table: a stationary 200° panorama
and a gnomonic camera centred on the Sun (10/20/40° horizontal FOV). Both share
one display adaptation and exposure; magnification never changes radiances or
selected spectra. Ground rays remain below the local horizon; the solar disk
is at the centre even near zenith. Camera/FOV/cache and symmetry tests are in
`tests/check-sky-camera.mjs`.

The theory article follows calculated results in the left column instead of
waiting for the full settings column to end. Browser inspection measured a
24 px gap before the article. The comparison image is a separate, explicitly
labelled observation: Curiosity/Mastcam, sol 956, 2015-04-15, PIA19400,
NASA/JPL-Caltech/MSSS/Texas A&M Univ. Original:
https://www.jpl.nasa.gov/images/pia19400-sunset-in-mars-gale-crater/
Asset: https://d2pn8kiwq2w21t.cloudfront.net/original_images/jpegPIA19400.jpg
