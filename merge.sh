printf "$1 $2 $3 $4 $5"

git checkout master
git checkout -b $1
git checkout $1

git merge --allow-unrelated-histories local/$2 local/$3 local/$4 local/$5
git read-tree local/$2 local/$3 local/$4 local/$5
git commit --no-edit
git reset --hard
