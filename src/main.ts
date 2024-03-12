import * as core from '@actions/core'
import axios from 'axios'
import { createHmac } from 'crypto'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const echoUrl: string = core.getInput('echoUrl')

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Echo URL ${echoUrl} ...`)

    const inputs = {
      novuApiKey: core.getInput('novuApiKey'),
      echoUrl: core.getInput('echoUrl'),
      backendUrl: core.getInput('backendUrl')
    }

    await syncState(inputs.echoUrl, inputs.novuApiKey, inputs.backendUrl)

    // Set outputs for other workflow steps to use
    core.setOutput('status', true)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}

export async function syncState(
  echoUrl: string,
  novuApiKey: string,
  backendUrl: string
): Promise<object> {
  const timestamp = Date.now()
  const discover = await axios.get(`${echoUrl}?action=discover`, {
    headers: {
      'x-novu-signature': `t=${timestamp},v1=${createHmac('sha256', novuApiKey)
        .update(`${timestamp}.${JSON.stringify({})}`)
        .digest('hex')}`
    }
  })

  const sync = await axios.post(
    `${backendUrl}/v1/echo/sync?source=githubAction`,
    {
      chimeraUrl: echoUrl,
      workflows: discover.data.workflows
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${novuApiKey}`
      }
    }
  )

  return sync.data
}
