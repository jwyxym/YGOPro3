find . -mindepth 1 -maxdepth 1 -type d | while read -r dir; do
    file=$(find "$dir" -maxdepth 1 -type f | head -n 1)
    [ -n "$file" ] || continue

    filename=$(basename "$file")
    dirname=$(basename "$dir")

    if [ "$filename" != "$dirname" ]; then
        mv "$file" "$dir/$dirname"
    fi
done