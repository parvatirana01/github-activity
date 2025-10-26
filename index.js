#!/usr/bin/env node
const https = require('https');

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
    console.log('Usage: node index.js <username>');
    process.exit(1);
}

// Function to fetch GitHub user events
function fetchGitHubActivity(username) {
    const options = {
        hostname: 'api.github.com',
        path: `/users/${username}/events`,
        method: 'GET',
        headers: {
            'User-Agent': 'GitHub-Activity-CLI',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';

        // Handle different status codes
        if (res.statusCode === 404) {
            console.error(`Error: User '${username}' not found`);
            process.exit(1);
        } else if (res.statusCode !== 200) {
            console.error(`Error: GitHub API returned status code ${res.statusCode}`);
            process.exit(1);
        }

        // Collect data chunks
        res.on('data', (chunk) => {
            data += chunk;
        });

        // When all data is received
        res.on('end', () => {
            try {
                const events = JSON.parse(data);
                displayActivity(events);
            } catch (error) {
                console.error('Error parsing response:', error.message);
                process.exit(1);
            }
        });
    });

    // Handle request errors
    req.on('error', (error) => {
        console.error('Error fetching data:', error.message);
        process.exit(1);
    });

    req.end();
}

// Function to format and display activity
function displayActivity(events) {
    if (!events && events.length === 0) {
        console.log('No recent activity found.');
        
        return;
    }

    console.log(`\nRecent Activity:`);
    console.log('='.repeat(50));

    events.forEach((event) => {
        const message = formatEvent(event);
        if (message) {
            console.log(`- ${message}`);
        }
    });
}

// Function to format individual events
function formatEvent(event) {
    const repo = event.repo.name;
    const type = event.type;

    switch (type) {
        case 'PushEvent':
            const commitCount = event.payload.commits?.length;
            return `Pushed ${commitCount} commit(s) to ${repo}`;
        
        case 'IssuesEvent':
            const action = event.payload.action;
            return `${capitalize(action)} an issue in ${repo}`;
        
        case 'WatchEvent':
            return `Starred ${repo}`;
        
        case 'ForkEvent':
            return `Forked ${repo}`;
        
        case 'CreateEvent':
            const refType = event.payload.ref_type;
            return `Created ${refType} in ${repo}`;
        
        case 'DeleteEvent':
            const deleteRefType = event.payload.ref_type;
            return `Deleted ${deleteRefType} in ${repo}`;
        
        case 'PullRequestEvent':
            const prAction = event.payload.action;
            return `${capitalize(prAction)} a pull request in ${repo}`;
        
        case 'IssueCommentEvent':
            return `Commented on an issue in ${repo}`;
        
        case 'ReleaseEvent':
            return `Published a release in ${repo}`;
        
        case 'MemberEvent':
            return `Added a collaborator to ${repo}`;
        
        default:
            return `${type.replace('Event', '')} in ${repo}`;
    }
}

// Helper function to capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Run the program
console.log(`Fetching activity for user: ${username}...`);
fetchGitHubActivity(username);