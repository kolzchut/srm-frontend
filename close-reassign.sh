#!/bin/zsh
git commit -m "fixes kolzchut/srm#$1 $3"
git push
gh -R kolzchut/srm issue edit $1 --remove-assignee "@me" --add-assignee "$2"
