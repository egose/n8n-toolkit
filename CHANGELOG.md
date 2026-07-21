## [0.9.0](https://github.com/egose/n8n-toolkit/compare/v0.8.0...v0.9.0) (2026-07-21)

### Features

* **n8n-client:** align client APIs and contract coverage with v1.1.1 handler behavior ([03460a3](https://github.com/egose/n8n-toolkit/commit/03460a3ab05a90e16f001bae614fbea6dad4df4a))
* **n8n-client:** align project and variable resources with handler payloads ([2eecc68](https://github.com/egose/n8n-toolkit/commit/2eecc68ffa2adda65377b9a5d5d8d551a7d78b42))
* **n8n-client:** expand package import and export multipart options ([c1b8acb](https://github.com/egose/n8n-toolkit/commit/c1b8acb8266a44be62e53dbae88267176226fa39))

### Documentation

* **n8n-client:** regenerate public api diff artifacts ([96ccaba](https://github.com/egose/n8n-toolkit/commit/96ccaba8cd3776d2277ca1799fef6ab897096aa6))

## [0.8.0](https://github.com/egose/n8n-toolkit/compare/v0.7.0...v0.8.0) (2026-07-21)

### Features

* **n8n-sync:** add integration sandbox and end-to-end sync coverage ([ef4f085](https://github.com/egose/n8n-toolkit/commit/ef4f0858968c8d21c7b4fe7282192d78573f346d))
* **n8n-sync:** add owner project fallback for synced entities and update hook env docs ([5376d46](https://github.com/egose/n8n-toolkit/commit/5376d46b3f1e9d056156664014aa547df4b4e4f3))
* **n8n-sync:** handle n8n hook payload variations for workflows and credentials ([67eb8e2](https://github.com/egose/n8n-toolkit/commit/67eb8e22797e238af63693b8af953ae1c64e415f))

### Bug Fixes

* **n8n-sync:** fail fast when integration source credentials are unauthorized ([5d96a3f](https://github.com/egose/n8n-toolkit/commit/5d96a3fd8c9d76f100189056ba00234aaab56615))
* **n8n-sync:** resolve credentials from payload or database consistently ([537a726](https://github.com/egose/n8n-toolkit/commit/537a726f0565833037aa26338e233d8b6600406d))

### Documentation

* add container examples for syncing hooks ([c8b1400](https://github.com/egose/n8n-toolkit/commit/c8b14002c767660ee68fdb923f58ac1a02de8e99))
* **n8n-sync:** clarify external hook configuration in package guidance ([1b2d034](https://github.com/egose/n8n-toolkit/commit/1b2d034105ddf54a78b0361e06ce55ea61a87740))

## [0.7.0](https://github.com/egose/n8n-toolkit/compare/v0.6.0...v0.7.0) (2026-07-20)

### Features

* add n8n sync hook bundles and documentation ([c16ddca](https://github.com/egose/n8n-toolkit/commit/c16ddca194976364f93db5ef4f69e98ef232ac24))
* **n8n-sync:** add multi-target sync delivery and dual auth modes ([d4d172d](https://github.com/egose/n8n-toolkit/commit/d4d172d689a2e5835bdb1eba13a9e88079568f57))

### Documentation

* **n8n-sync:** update sync package documentation for fan-out and hmac auth ([a6286e0](https://github.com/egose/n8n-toolkit/commit/a6286e024f119a36fb84ba7a0efda18df273e4ef))

## [0.6.0](https://github.com/egose/n8n-toolkit/compare/v0.5.0...v0.6.0) (2026-07-19)

### Features

* **n8n-client:** modernize package layout and workspace tooling ([4ee3271](https://github.com/egose/n8n-toolkit/commit/4ee3271961e67ca76ce2e2cc1a7363ae6f0cef75))

## [0.5.0](https://github.com/egose/n8n-toolkit/compare/v0.4.5...v0.5.0) (2026-07-08)

### Features

* migrate changelog generation to repo-toolkit package and update pre-commit workflow ([fadf938](https://github.com/egose/n8n-toolkit/commit/fadf938282432cfb665cd3431cff7abc01013e24))

## [0.4.5](https://github.com/egose/n8n-toolkit/compare/v0.4.4...v0.4.5) (2026-07-06)

### Documentation

* update license copyright notice ([d41e6f2](https://github.com/egose/n8n-toolkit/commit/d41e6f2f6c223a43098f49682f7faae7594d967a))

## [0.4.4](https://github.com/egose/n8n-toolkit/compare/v0.4.3...v0.4.4) (2026-06-25)

## [0.4.3](https://github.com/egose/n8n-toolkit/compare/v0.4.2...v0.4.3) (2026-06-19)

## [0.4.2](https://github.com/egose/n8n-toolkit/compare/v0.4.1...v0.4.2) (2026-06-19)

### Code Refactoring

* **website:** move faster plugin to devDependencies and adjust tailwind layers ([6ccaeba](https://github.com/egose/n8n-toolkit/commit/6ccaeba1a85dc12eb4e0eeda11a8b597ec98c939))

## [0.4.1](https://github.com/egose/n8n-toolkit/compare/v0.4.0...v0.4.1) (2026-06-16)

### Bug Fixes

* remove ignored and obsolete public API v1 artifacts ([e46aa55](https://github.com/egose/n8n-toolkit/commit/e46aa555f95608e47b5592e867fb4a73a5ad098d))

## [0.4.0](https://github.com/egose/n8n-toolkit/compare/v0.3.0...v0.4.0) (2026-06-14)

### Features

* **website:** add logo lockup assets ([a6d54c8](https://github.com/egose/n8n-toolkit/commit/a6d54c898d06e64f3038752938b9adcaff3bc354))

## [0.3.0](https://github.com/egose/n8n-toolkit/compare/v0.2.1...v0.3.0) (2026-06-14)

### Features

* expand and refine API type definitions ([2437e7b](https://github.com/egose/n8n-toolkit/commit/2437e7b6e425e4900c453574904df7d408530031))
* **website:** add patch and patchResource for partial updates and improve documentation ([e916523](https://github.com/egose/n8n-toolkit/commit/e916523b32b8c476849b65348983420172b7698b))

### Documentation

* add JSDoc to N8nClient and create coding agent guide ([28013b1](https://github.com/egose/n8n-toolkit/commit/28013b127c4afe2c63e7c78e12a7d2f1ce02cb47))

## [0.2.1](https://github.com/egose/n8n-toolkit/compare/v0.2.0...v0.2.1) (2026-06-14)

### Documentation

* **website:** document resource classes and update api examples ([1863152](https://github.com/egose/n8n-toolkit/commit/1863152e2fa31f8028bd45482027c150c196916b))

## [0.2.0](https://github.com/egose/n8n-toolkit/compare/v0.1.2...v0.2.0) (2026-06-13)

### Features

* **website:** add bound resource clients and resource helpers across website API ([06929b2](https://github.com/egose/n8n-toolkit/commit/06929b242b5bca3d81b2a2ffc5b3a54dca127121))
* **website:** rename resource handles to clients and update factory methods ([cd551cc](https://github.com/egose/n8n-toolkit/commit/cd551cc860cbc0ee3a1b8fbb28985a56704f0c77))

### Documentation

* **website:** document raw versus resource client usage patterns ([1015838](https://github.com/egose/n8n-toolkit/commit/101583834502dd253d705dc5dcad55c4ad68d9d8))
* **website:** refresh website docs and examples for client naming ([bf646e5](https://github.com/egose/n8n-toolkit/commit/bf646e51b3c95f3e7a94414a8196e1336e2f9037))

## [0.1.2](https://github.com/egose/n8n-toolkit/compare/v0.1.1...v0.1.2) (2026-06-13)

### Documentation

* **website:** update api reference and project documentation ([8eb8e1d](https://github.com/egose/n8n-toolkit/commit/8eb8e1dab71a2cf077cf35dc3d88c8b1f580f3cd))

### Code Refactoring

* **website:** introduce base handle and refine api types ([33202cf](https://github.com/egose/n8n-toolkit/commit/33202cf3bf58a4c3b0d80df81079fe14bcab4fda))

## [0.1.1](https://github.com/egose/n8n-toolkit/compare/v0.1.0...v0.1.1) (2026-06-11)

## [0.1.0](https://github.com/egose/n8n-toolkit/compare/af6753477e8559b1324897e2af7f99772846a4a2...v0.1.0) (2026-06-11)

### Features

* **website:** expand public API handlers, mappers, and website samples for new endpoint coverage ([af67534](https://github.com/egose/n8n-toolkit/commit/af6753477e8559b1324897e2af7f99772846a4a2))

### Documentation

* **website:** add secret scanning pragmas to samples and documentation ([7f7c503](https://github.com/egose/n8n-toolkit/commit/7f7c5031da1ea29a9b134bf72717d32770b1c2dd))
