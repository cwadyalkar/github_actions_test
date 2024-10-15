import React, { useState } from 'react';
import axios from 'axios';
import Editor from '@monaco-editor/react';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [githubId, setGithubId] = useState('');
  const [branchCreated, setBranchCreated] = useState(false);
  const [code, setCode] = useState('// Write your code here');
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);



  const repoOwner = 'cwadyalkar'; // Replace with the application's GitHub username
  const repoName = 'github_actions_test';   // Replace with your repository name
  const personalAccessToken = import.meta.env.VITE_GITHUB_TOKEN;
   // Replace with your GitHub token (requires repo access)

  const handleEnroll = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGithubId('');
  };

  const handleSubmitGithubId = async () => {
    if (!githubId) {
      alert("GitHub ID is required");
      return;
    }

    const branchName = `${githubId}-branch`.replace(/[^a-zA-Z0-9-_]/g, ''); // Sanitize branch name

    try {
      // Get the latest commit SHA from the main branch
      const branchResponse = await axios.get(
        `https://api.github.com/repos/${repoOwner}/${repoName}/branches/main`,
        { headers: { Authorization: `token ${personalAccessToken}` } }
      );

      const latestCommitSha = branchResponse.data.commit.sha;

      // Create a new branch in the application repo using the user's GitHub ID
      await axios.post(
        `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs`,
        { ref: `refs/heads/${branchName}`, sha: latestCommitSha },
        { headers: { Authorization: `token ${personalAccessToken}` } }
      );

      setBranchCreated(true);
      setIsModalOpen(false);
      setIsEditorOpen(true); // Open the code editor after branch creation
    } catch (error) {
      console.error('Error creating branch:', error);
      alert('Failed to create branch. Please check your GitHub permissions and the repository settings.');
    }
  };

  const handleCodeSubmit = async () => {
    if (!branchCreated) {
      alert('You need to enroll and create a branch first.');
      return;
    }

    if (!githubId) {
      alert('GitHub ID is missing. Please enroll first.');
      return;
    }

    const branchName = `${githubId}-branch`.replace(/[^a-zA-Z0-9-_]/g, ''); // Sanitize branch name

    try {
      // Check if the file exists in the branch
      let fileSha;
      try {
        const fileResponse = await axios.get(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/task.js?ref=${branchName}`,
          { headers: { Authorization: `token ${personalAccessToken}` } }
        );
        fileSha = fileResponse.data.sha; // If file exists, get its SHA
      } catch (err) {
        if (err.response.status === 404) {
          // If the file doesn't exist, set fileSha to undefined
          console.log('File does not exist, creating a new one...');
        } else {
          throw err; // Re-throw if it's another error
        }
      }

      const content = btoa(code); // Encode the code to base64 for GitHub API

      // Push the code to the newly created branch
      await axios.put(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/task.js`,
        {
          message: `Task submission by ${githubId}`,
          content,
          sha: fileSha, // Include SHA if it exists
          branch: branchName, // Correct branch name
        },
        { headers: { Authorization: `token ${personalAccessToken}` } }
      );

      setTaskCompleted(true);
      setCode('// Write your code here'); // Reset the code editor
    } catch (error) {
      console.error('Error submitting code:', error);

      if (error.response) {
        // Check if it's a 422 error and provide more detail
        if (error.response.status === 422) {
          alert('Failed to submit the code. Ensure the file exists and your branch is correct.');
        } else {
          alert('Error: ' + error.response.data.message);
        }
      } else {
        alert('Failed to submit the code. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">React Quiz Application</h1>

        <button
          onClick={handleEnroll}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
        >
          Enroll in Quiz
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Enter your GitHub ID</h2>
              <input
                type="text"
                placeholder="GitHub ID"
                value={githubId}
                onChange={(e) => setGithubId(e.target.value)}
                className="border-2 border-gray-300 p-2 w-full rounded-lg mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={handleSubmitGithubId}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  Submit
                </button>
                <button
                  onClick={handleCloseModal}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditorOpen && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Complete Your Task</h2>
            <Editor
              height="400px"
              defaultLanguage="javascript"
              value={code}
              onChange={(value) => setCode(value)}
              theme="vs-dark"
            />
            <button
              onClick={handleCodeSubmit}
              className="bg-green-500 text-white px-6 py-3 mt-4 rounded-lg hover:bg-green-600 transition"
            >
              Submit Code
            </button>
            {taskCompleted && <p className="mt-4 text-green-500 font-bold">Task completed successfully!</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
