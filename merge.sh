printf "$1 $2 $3 $4 $5"

git checkout master
git checkout -b $1
git checkout $1

git merge --allow-unrelated-histories $2 $3 $4 $5
git read-tree $2 $3 $4 $5
git commit --no-edit
git reset --hard
