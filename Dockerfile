FROM public.ecr.aws/lambda/python:3.9 AS builder

# Install build dependencies
RUN yum update -y && yum install -y \
    gcc \
    python3-devel \
    mariadb-devel \
    zip

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy files needed for building
COPY requirements.txt .
COPY lambda-build.sh .
COPY . .

# Run build script
RUN chmod +x lambda-build.sh
RUN ./lambda-build.sh

# Use a fresh image for running
FROM public.ecr.aws/lambda/python:3.9

# Copy package and app files
COPY --from=builder ${LAMBDA_TASK_ROOT}/lambda_package/* ${LAMBDA_TASK_ROOT}/
COPY . ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD [ "main.handler" ]
