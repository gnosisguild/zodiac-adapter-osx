# Zodiac OSx Adapter

[![Build Status](https://github.com/gnosisguild/zodiac-adapter-osx/actions/workflows/ci.yml/badge.svg)](https://github.com/gnosisguild/zodiac-adapter-osx/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/gnosisguild/zodiac-adapter-osx/badge.svg?branch=main&cache_bust=1)](https://coveralls.io/github/gnosisguild/zodiac-module-bridge?branch=main)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/gnosisguild/CODE_OF_CONDUCT)

This repo contains an adapter for connecting [Zodiac modules](https://github.com/gnosisguild/zodiac) to [Aragon OSx DAOs](https://github.com/aragon/osx/).

If you have any questions about Zodiac, join the [Gnosis Guild Discord](https://discord.gg/wwmBWTgyEq). Follow [@GnosisGuild](https://twitter.com/gnosisguild) on Twitter for updates.

## Features

- Connect Zodiac modules to Aragon OSx DAOs
- Unwrap multisend calls into multiple OSx actions

## Flow

- Deploy OSx DAO
- Deploy OSxAdapter
- Deploy Multisend Unwrapper
- Set Transaction Unwrapper for any multisend addresses to be supported
- Grant OSxAdapter the "EXECUTE_PERMISSION"
- Enable desired modules on the OSxAdapter

## Commands

To see available commands run `yarn hardhat`.

Some helpful commands:

```
yarn install # install dependencies
yarn build # compiles contracts
yarn test # runs the tests
yarn deploy # deploys the contracts add the `--network` param to select a network
```

### Security and Liability

All contracts are WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

### License

Created under the [LGPL-3.0+ license](LICENSE).
