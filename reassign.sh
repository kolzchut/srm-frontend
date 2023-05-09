#!/bin/zsh
gh -R kolzchut/srm issue edit $1 --remove-assignee "@me" --add-assignee "$2"
