# Art Pack 1: concept art (reference only)

Four night street scenes, one per district, generated with Higgsfield (GPT Image 2.5, 4:3) and
approved by the project owner as the style target. They are **not** shipped in the game.

> The images aren't committed: the build environment's network policy blocked the image host
> (`d8j0ntlcm91z4.cloudfront.net`), so the toolchain couldn't download them. Links below.

| District | Image |
|---|---|
| Meridian Core | https://d8j0ntlcm91z4.cloudfront.net/user_3GHLpEmatJr2mpeU0jdUXC3GSY2/hf_20261031_202505_38c21d8e-0acb-4d3f-825d-1ce48dd6e51f.png |
| Lumen Row | https://d8j0ntlcm91z4.cloudfront.net/user_3GHLpEmatJr2mpeU0jdUXC3GSY2/hf_20261031_202531_88a9c762-f3df-42f2-a1eb-5d471fe903f4.png |
| Ironwharf | https://d8j0ntlcm91z4.cloudfront.net/user_3GHLpEmatJr2mpeU0jdUXC3GSY2/hf_20261031_202506_22c91387-d744-4763-adcf-04dfad5091aa.png |
| The Undergrid | https://d8j0ntlcm91z4.cloudfront.net/user_3GHLpEmatJr2mpeU0jdUXC3GSY2/hf_20261031_202505_526edfe9-c206-419f-9860-5265faf4c622.png |

## Brief (shared by all four prompts)

DS-era handheld RPG pixel art; top-down 3/4 view showing front facades and rooftops; 16×16
tile grid; crisp hard pixels; bold dark navy outlines; 2–3 tone cel shading. **Heavy
cyberpunk**: night, rain, wet mirror-like asphalt, dense neon, holo-ads, drones, steam,
cables, megastructures looming. No text, people or logos.

The first round was rejected as "not cyberpunk enough". That led to the heavier mood
brief above.

## Style notes carried into the pixel assets

- **Night first.** Albedo is authored for neutral light, but every light source has an emissive
  mask so the game can dim the world and let neon carry the scene.
- **Wet streets.** `asphalt_3` is a neon puddle (dark water body, cyan and pink light smears).
- **District identity through one palette swap:** Meridian Core ice/cyan, Lumen Row
  purple-grey walls with pink frames and magenta accents, Ironwharf dark rust with grey trim and
  sodium orange, The Undergrid grimy dark concrete with toxic green and yellow.
- **Signage is glyph-free.** Neon pictograms (noodle bowl, cat, capsule, bolt, cocktail, eye)
  and abstract holo-ads keep everything original and language-neutral.
- **Clutter at roof level:** vents, water tanks, antennas with beacons, helipads, billboard
  frames.
