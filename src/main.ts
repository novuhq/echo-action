import * as core from '@actions/core'
import axios from 'axios'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const bridgeUrl: string = core.getInput('bridge-url')
    const secretKey: string = core.getInput('secret-key')
    const apiUrl: string = core.getInput('api-url')

    if (!bridgeUrl) {
      throw new Error('bridgeUrl must be set')
    }
    if (!secretKey) {
      throw new Error('secretKey must be set')
    }
    if (!apiUrl) {
      throw new Error('apiUrl must be set')
    }

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Bridge URL ${bridgeUrl} ...`)

    const response = await syncState(bridgeUrl, secretKey, apiUrl)

    // Set outputs for other workflow steps to use
    core.setOutput('result', response)
    core.setOutput('success', true)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
    core.setOutput('result', {})
    core.setOutput('success', false)
  }
}

export async function syncState(
  bridgeUrl: string,
  secretKey: string,
  apiUrl: string
): Promise<object> {
  const sync = await axios.post(
    `${apiUrl}/v1/bridge/sync?source=githubAction`,
    {
      bridgeUrl
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${secretKey}`
      }
    }
  )

  return sync.data
}
