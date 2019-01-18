#!/bin/bash
git for-each-ref --format='%(refname)' refs/remotes/origin |
    while read name; do
        shortname=${name#refs/remotes/}
        localname=${name#refs/remotes/origin/}
        # if we have a branch named $localname, make sure it
        # identifies the same commit as $name.  If not, create
        # one pointing to $name.
        fullname=refs/heads/$localname  # use full name in case of tags etc
        if hash=$(git rev-parse $fullname); then
            if test $hash != $(git rev-parse $name); then
                echo "WARNING: local branch $localname differs from $shortname"
            else
                echo "local branch $localname is good (matches $shortname)"
            fi
        else
            echo "creating local branch $localname to match $shortname"
            # NB: you can add --track here but that is the default anyway
            if ! git branch $localname $name; then
                echo "WARNING: failed to create $localname"
            fi
        fi
    done
