#!/bin/bash

cd ~/rewritten

git clone git@github.com:pdffiller/jsfcore.git
git clone git@github.com:pdffiller/jsfiller3.git
git clone git@github.com:pdffiller/ws-editor-lib.git
git clone git@github.com:pdffiller/snfiller.git

cd ~/rewritten/jsfcore
~/makeMono/remote2local.sh

cd ~/rewritten/jsfiller3
~/makeMono/remote2local.sh

cd ~/rewritten/snfiller
~/makeMono/remote2local.sh

cd ~/rewritten/ws-editor-lib
~/makeMono/remote2local.sh
