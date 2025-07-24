import {OpenAI} from "openai";
import {ChatCompletionMessageParam} from 'openai/resources/chat';

const openAI = new OpenAI();

function getTimeOfDay() {
    return '7:15';
}

async function callOpenAIWithTools() {
    const context: ChatCompletionMessageParam[] = [
        {
            role: 'system',
            content: 'You are a helpful assistant that gives information about the time of day'
        },
        {
            role: 'user',
            content: 'What is the time of day?'
        }
    ];
    const response = await openAI.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: context,
        tools: [
            {
                type: 'function',
                function: {
                    name: 'getTimeOfDay',
                    description: 'Get the time of day'
                }
            }
        ],
        tool_choice: 'auto'
    });
    const willInvokeFunction = response.choices[0].finish_reason == 'tool_calls';
    const toolCall = response.choices[0].message.tool_calls![0];
    if (willInvokeFunction) {
        const toolName = toolCall.function.name;
        if (toolName == 'getTimeOfDay') {
            const toolResponse = getTimeOfDay();
            context.push(response.choices[0].message);
            context.push({
                role: 'tool',
                content: toolResponse,
                tool_call_id: toolCall.id
            });
        }
    }

    const secondResponse = await openAI.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: context
    });

    console.log(secondResponse.choices[0].message.content);
}

callOpenAIWithTools();