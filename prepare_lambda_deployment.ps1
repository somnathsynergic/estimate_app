# Clean up any existing resources
if (Test-Path .\lambda_package) {
    Remove-Item -Path ".\lambda_package" -Recurse -Force
}
if (Test-Path .\lambda_deployment.zip) {
    Remove-Item -Path ".\lambda_deployment.zip" -Force
}

# Build the Lambda package using Docker
Write-Host "Building Lambda package using Docker..."
docker build -t lambda-builder .

# Create a container and copy the package
Write-Host "Extracting package from Docker container..."
$containerId = docker create lambda-builder
docker cp ${containerId}:/var/task/lambda_package .
docker rm $containerId

# Create deployment package
Compress-Archive -Path ".\lambda_package\*" -DestinationPath ".\lambda_deployment.zip" -Force

# Clean up
Remove-Item -Path ".\lambda_package" -Recurse -Force

Write-Host "Deployment package created as lambda_deployment.zip"
