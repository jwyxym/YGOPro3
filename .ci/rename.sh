find . -mindepth 1 -maxdepth 1 -type d | while read -r dir; do
    file=$(find "$dir" -maxdepth 1 -type f | head -n 1)
    [ -n "$file" ] || continue

    newname="$(basename "$dir")"

    mv "$file" "$dir/$newname"
done