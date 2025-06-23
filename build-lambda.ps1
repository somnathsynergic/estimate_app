# Build the Docker image
docker build -t lambda-builder .

# Run the container and copy the package
docker run --rm -v ${PWD}:/output lambda-builder /bin/bash -c "cd /var/task && bash lambda-build.sh && cp -r lambda_package/* /output/lambda_deployment/"

# Create the deployment package
Compress-Archive -Path lambda_deployment/* -DestinationPath lambda_deployment.zip -Force

Write-Host "Lambda deployment package created successfully!"
