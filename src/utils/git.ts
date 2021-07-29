
import githubUrlFromGit = require('github-url-from-git');

export function deriveUrl(workingUrl: string) {
    const resultUrl = githubUrlFromGit(workingUrl, {
        "extraBaseUrls": [
            "bitbucket.org",
            "gitlab.com"
        ]
    });
    return resultUrl;
}