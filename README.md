Generate Zips Within Given Radius
===============

This script reads a file from the root directory named `input.csv` and generates a JSON file named `labor.json` that is in the exact format needed for `shared-modules/zipline` to work.

The 'input.csv' file is generated from this spreadsheet:

https://docs.google.com/a/moveline.com/spreadsheets/d/1xJtk_nqVMitthA3--CD2yrXz8W1fiaPonBegCe7WmaY/edit#gid=0

## To Run

`node get_zips_with_callbacks.js`

## Note

`get_zips_with_promises.js` is still a work-in-progress and does not currently work.