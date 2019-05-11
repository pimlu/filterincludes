# Filter Includes extension

This extension is basically an automation of [this SO answer](https://stackoverflow.com/a/614915) from 10 years ago. It's probably a bad idea to use this thing.

## Features

 * Automatically removes header files, keeps the ones necessary to compile!
 * Will remove anything you ask it to! (Code! Comments! Documentation!)
 * Remembers the previous command you used to build!
 * As fast as your build times!

## How to use

 * Select some lines of text containing your includes
 * `ctrl+shift+p`, select "Filter Includes" command
 * It will prompt you for a build command, e.g. `make`.
    * (This will run with your project as the current working directory, so you might need `cd build && make`)
 * Press enter - don't touch anything! It will try removing includes.
 * If it did break stuff, `ctrl+z` will work.

