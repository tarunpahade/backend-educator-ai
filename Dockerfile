# Use a base image with Node.js pre-installed
FROM node:slim

# Set the working directory in the container
WORKDIR /app

# Copy the application files to the container
COPY . /app

# Install Node.js dependencies
RUN npm install

# Install Python
RUN apt-get update && \
    apt-get install -y python3 && \
    ln -s /usr/bin/python3 /usr/bin/python

# Install g++ for C++
RUN apt-get install -y g++

# Install gcc for C
# Note: g++ installation above will typically include gcc as well

# Install Java
RUN apt-get install -y default-jdk

# Install Redis
RUN apt-get install -y redis-server

# Expose the port the app runs on
EXPOSE 3000

# Start Redis server and the Node.js app
CMD redis-server --daemonize yes && npm start
