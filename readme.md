# Install

yarn install

# Install Playwright browsers and dependencies

yarn playwright install --with-deps

# Copy the example.env > .env

This stores your local credentials

# (Optionally) Pull front-end/backend tests:

yarn get-tests

# Setup container api for testing with clients

## Podman

As your user, run podman to serve the api:
```
podman system service -t 0 /tmp/podman.sock
```

Uncomment the DOCKER_SOCKET option in the .env file:
```
DOCKER_SOCKET="/tmp/podman.sock"
```

## Docker

* ensure the docker service is running
* ensure your user is part of the 'docker' user group


# Option 1 Run local:

For local testing, make sure your front-end/backend servers are running and accessible, then:

- Ensure you do NOT specify a proxy in your .env file (put an empty value: "")
- Make sure your .env's BASE_URL is pointed to the local front-end server "https://stage.foo.redhat.com:1337"
- USER1USERNAME="<YOUR_STAGE_QE_USER>"
- USER1PASSWORD="<YOUR_STAGE_QE_USER_PASSWORD>"

Note: For Ethel, your user will require the following skus: MCT4022,MCT3718,MCT3695,ES0113909

# Option 2 Run against stage:

For local stage testing, make sure the following:

- PROXY must be set correctly in your .env file.
- Make sure your .env's BASE_URL is pointed to the targeted env, if targeting PROD, the proxy is not needed.
- USER1USERNAME="<YOUR_STAGE_QE_USER>"
- USER1PASSWORD="<YOUR_STAGE_QE_USER_PASSWORD>"

Note: For Ethel, your user will require the following skus: MCT4022,MCT3718,MCT3695,ES0113909

# Run your tests:

yarn playwright test

# Run a specific test:

yarn playwright test UI/CreateCustomRepo.spec.ts
