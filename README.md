# Filter Includes extension

This extension (marketplace [link](https://marketplace.visualstudio.com/items?itemName=pimlu.filterincludes)) is basically an automation of [this SO answer](https://stackoverflow.com/a/614915) from 10 years ago. It's probably a bad idea to use this thing.

## Features

 * Automatically removes header files, keeps the ones necessary to compile!
 * Will remove anything you ask it to! (Code! Comments! Documentation!)
 * Remembers the previous command you used to build!
 * As fast as your build times!

## How to use

 * Select some lines of text containing your includes
 * `ctrl+shift+p`, select "Filter Includes" command
 * It will prompt you for a build command, e.g. `make`.
 * Press enter - don't touch anything! It will try removing includes.
 * If it did break stuff, `ctrl+z` will work.

## Tips

  * This uses your project as the current directory, so you might use `cd build && make` as your build command
