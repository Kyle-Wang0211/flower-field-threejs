# Flower Field Interaction

This version is based on Aidan Nelson's `week-05-raycasting` starter from the `3d-in-the-browser` course repo:

- https://github.com/AidanNelson/3d-in-the-browser/tree/main/week-05-raycasting
- Repo: https://github.com/Kyle-Wang0211/flower-field-threejs
- Live demo: https://kyle-wang0211.github.io/flower-field-threejs/

What was adapted from the starter:

- the import-map / module setup in `index.html`
- the `three.js` scene and camera structure
- `OrbitControls`
- normalized mouse coordinates
- `Raycaster` logic for hovering over the ground
- click-to-place interaction on the ground plane

What was added for this assignment:

- a grassy field made from many small grass instances
- a glowing hover marker
- custom flower geometry
- click anywhere on the grass to plant a flower
- simple flower growth and swaying animation
