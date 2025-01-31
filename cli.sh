#!/bin/bash

# Default host URL
DEFAULT_HOST="https://baldosa-api.ehsandar.top"

# Parse command-line options
while getopts ":h:" opt; do
    case $opt in
    h)
        HOST="$OPTARG"
        ;;
    \?)
        echo "Invalid option: -$OPTARG" >&2
        exit 1
        ;;
    :)
        echo "Option -$OPTARG requires an argument." >&2
        exit 1
        ;;
    esac
done

# If HOST is not set by the -h option, fall back to the default
HOST=${HOST:-$DEFAULT_HOST}

# This file will store the JWT token
TOKEN_FILE="./cli_jwt.txt"

echo "Welcome to the interactive CLI for tile management."
echo "Connected to server: $HOST"

create_account() {
    echo "Creating an account..."
    read -p "Email: " email
    read -sp "Password: " password
    echo

    response=$(curl -s -L -w "%{http_code}" -o temp_response.txt -X POST "$HOST/users/" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")

    http_status=$(tail -n1 <<<"$response")
    response_body=$(cat temp_response.txt)

    if [ "$http_status" -eq 200 ]; then
        jwt=$(echo $response_body | jq -r '.jwt')
        echo $jwt >"$TOKEN_FILE"
        echo "Account created successfully and JWT token saved."
    else
        echo "Failed to create account: $response_body"
    fi
    rm temp_response.txt
}

login() {
    echo "Logging in..."
    read -p "Email: " email
    read -sp "Password: " password
    echo

    response=$(curl -s -L -w "%{http_code}" -o temp_response.txt -X POST "$HOST/users/login/" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"password\": \"$password\"}")

    http_status=$(tail -n1 <<<"$response")
    response_body=$(cat temp_response.txt)

    if [ "$http_status" -eq 200 ]; then
        jwt=$(echo $response_body | jq -r '.jwt')
        echo $jwt >"$TOKEN_FILE"
        echo "Login successful and JWT token saved."
    else
        echo "Login failed: $response_body"
    fi
    rm temp_response.txt
}

get_me() {
    if [ ! -f "$TOKEN_FILE" ]; then
        echo "You must be logged in to perform this action."
        return
    fi
    token=$(cat "$TOKEN_FILE")

    # Function to decode JWT
    decode_jwt() {
        local jwt="$1"
        # Extract the payload part of the JWT, replace URL-safe characters, then decode
        local payload=$(echo "$jwt" | cut -d "." -f2 | tr '_-' '/+' | base64 --decode 2>/dev/null)
        echo "$payload" | jq .
    }

    # Decode JWT and extract standard fields
    jwt_payload=$(decode_jwt "$token")

    # Extract and print desired fields
    iss=$(echo "$jwt_payload" | jq -r '.iss')
    exp=$(echo "$jwt_payload" | jq -r '.exp')

    echo "JWT Issuer (iss): $iss"

    # Convert `exp` timestamp to human-readable format
    if [[ "$exp" =~ ^[0-9]+$ ]]; then
        exp_date=$(date -d @"$exp" 2>/dev/null) || exp_date=$(date -r "$exp" 2>/dev/null)
        echo "JWT Expiration Time (exp): $exp_date"
    else
        echo "JWT Expiration Time (exp): Invalid timestamp"
    fi

    response=$(curl -s -L -w "%{http_code}" -o temp_response.txt -X GET "$HOST/users/me" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token")

    http_status=$(tail -n1 <<<"$response")
    response_body=$(cat temp_response.txt)

    if [ "$http_status" -eq 200 ]; then
        echo "User Info: $response_body"
    else
        echo "Failed to get user information: $response_body"
    fi
    rm temp_response.txt
}

get_tile_data() {
    if [ ! -f "$TOKEN_FILE" ]; then
        echo "You must be logged in to perform this action."
        return
    fi
    token=$(cat "$TOKEN_FILE")

    read -p "Tile X Coordinate: " x
    read -p "Tile Y Coordinate: " y

    # Perform the request to get tile data
    response=$(curl -s -L -w "%{http_code}" -o temp_response.txt -X GET "$HOST/tiles/$x/$y" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token")

    http_status="${response: -3}"
    response_body=$(<temp_response.txt)

    if [ "$http_status" -eq 200 ]; then
        echo "Tile data: $response_body"
    else
        echo "Failed to get tile data: HTTP status code $http_status, response: $response_body"
    fi
    rm temp_response.txt

    # CDN Base URL
    CDN_BASE_URL="https://dp5ho7dvg88z2.cloudfront.net"
    image_sizes=(1 24 48 96 156 300)

    for size in "${image_sizes[@]}"; do
        image_url="${CDN_BASE_URL}/tile-${x}-${y}-${size}.jpg"

        if curl --head --silent --fail "$image_url" > /dev/null; then
            echo "Image of size ${size} exists on CDN: $image_url"
        else
            echo "No image found on CDN for tile $x-$y with size ${size}."
        fi
    done

    # Attempt to retrieve metadata for image of size 24
    image_url="${CDN_BASE_URL}/tile-${x}-${y}-24.jpg"

    if curl --head --silent "$image_url" -o headers.txt; then
        echo "Headers for image of size 24:"

        # Extract headers and display them
        etag=$(grep -i '^etag:' headers.txt | awk '{print $2}')
        last_modified=$(grep -i '^last-modified:' headers.txt | cut -d':' -f2-)
        link=$(grep -i '^x-amz-meta-link:' headers.txt | cut -d':' -f2-)
        title=$(grep -i '^x-amz-meta-title:' headers.txt | cut -d':' -f2-)
        subtitle=$(grep -i '^x-amz-meta-subtitle:' headers.txt | cut -d':' -f2-)

        echo "Etag: $etag"
        echo "Last-Modified: $last_modified"
        echo "x-amz-meta-link: $link"
        echo "x-amz-meta-title: $title"
        echo "x-amz-meta-subtitle: $subtitle"

        # Remove the temporary headers file
        rm headers.txt
    else
        echo "Failed to retrieve headers for tile $x-$y with size 24."
    fi
}

upload_image_edit_tile() {
    if [ ! -f "$TOKEN_FILE" ]; then
        echo "You must be logged in to perform this action."
        return
    fi
    token=$(cat "$TOKEN_FILE")

    read -p "Tile X Coordinate: " x
    read -p "Tile Y Coordinate: " y

    # Prompt for the image file path
    read -p "Enter the relative path to the image file: " image_path

    # Check if the file exists
    if [ ! -f "$image_path" ]; then
        echo "Error: File not found at the specified path. Please check the path and try again."
        return
    fi

    response=$(curl -s -L -X POST "$HOST/tiles/$x/$y/images" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token" \
        -d '{"content_type": "image/jpeg"}')

    upload_url=$(echo $response | jq -r '.upload_url')

    if [ "$upload_url" != "null" ]; then
        echo "Uploading image..."
        curl -L -X PUT "$upload_url" -H "Content-Type: image/jpeg" --data-binary @"$image_path"

        echo "Image uploaded successfully."

        read -p "Title: " title
        read -p "Subtitle: " subtitle
        read -p "Link: " link

        response=$(curl -s -L -X PUT "$HOST/tiles/$x/$y" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "{\"title\": \"$title\", \"subtitle\": \"$subtitle\", \"link\": \"$link\"}")

        echo "Tile edit response: $response"
    else
        echo "Failed to get upload URL: $response"
    fi
}

purchase_tile() {
    if [ ! -f "$TOKEN_FILE" ]; then
        echo "You must be logged in to perform this action."
        return
    fi
    token=$(cat "$TOKEN_FILE")

    read -p "Tile X Coordinate: " x
    read -p "Tile Y Coordinate: " y

    # Fetch tile data to confirm the price
    response=$(curl -s -L -o temp_response.txt -w "%{http_code}" -X GET "$HOST/tiles/$x/$y" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token")

    http_status="${response}"
    response_body=$(<temp_response.txt)

    # Extract the price of the tile
    price=$(echo "$response_body" | jq -r '.price')

    rm temp_response.txt

    if [[ "$http_status" -ne 200 ]] || [[ -z "$price" || "$price" == "null" ]]; then
        echo "Unable to retrieve tile price or the tile is not on sale."
        return
    fi

    echo "The price of the tile at ($x, $y) is $price."

    read -p "Do you want to purchase this tile? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Purchase cancelled."
        return
    fi

    # Proceed to purchase the tile
    purchase_http_status=$(curl -s -L -o /dev/null -w "%{http_code}" -X POST "$HOST/tiles/$x/$y" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $token")

    if [[ "$purchase_http_status" -eq 200 ]]; then
        echo "Tile successfully purchased."
    else
        echo "Failed to purchase tile. HTTP status code: $purchase_http_status"
    fi
}

# Main loop
while true; do
    echo
    echo "1. Create account"
    echo "2. Login"
    echo "3. Get user information (Me)"
    echo "4. Get tile data"
    echo "5. Purchase a tile"
    echo "6. Upload image and edit a tile"
    echo "7. Exit"
    read -p "Choose an option: " option

    case $option in
    1) create_account ;;
    2) login ;;
    3) get_me ;;
    4) get_tile_data ;;
    5) purchase_tile ;;
    6) upload_image_edit_tile ;;
    7) exit 0 ;;
    *) echo "Invalid option." ;;
    esac
done