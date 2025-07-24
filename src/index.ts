import {OpenAI} from "openai";
import {encoding_for_model} from 'tiktoken';

const encoder = encoding_for_model('gpt-4-turbo');
const MAX_TOKENS: number = 700;

const openai = new OpenAI();
const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
        role: 'system',
        content: 'You are a helpful chatbot'
    }
];

function getContextLength() {
    let length = 0;
    context.forEach((message) => {
        if (typeof message.content == 'string') {
            length += encoder.encode(message.content).length;
        } else if (Array.isArray(message.content)) {
            message.content.forEach((messageContent) => {
                if (messageContent.type == 'text') {
                    length += encoder.encode(messageContent.text).length;
                }
            });
        }
    });
    return length;
}

function deleteOlderChatMessages() {
    let contextLength = getContextLength();
    while (contextLength > MAX_TOKENS) {
        for (let i = 0; i < context.length; i++) {
            const message = context[i];
            if (message.role != 'system') {
                context.splice(i, 1);
                contextLength = getContextLength();

                console.log(`New context length: ${contextLength}`);
                break;
            }
        }
    }
}

async function createChatCompletion() {
    const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: context
    });
    const responseMessage = response.choices[0].message;
    context.push({
        role: 'assistant',
        content: responseMessage.content
    });

    if (response.usage && response.usage.total_tokens > MAX_TOKENS) {
        deleteOlderChatMessages();
    }

    console.log(`${response.choices[0].message.role}: ${response.choices[0].message.content}`);
}

process.stdin.addListener('data', async function (input) {
    const userInput = input.toString().trim();
    context.push({
        role: 'user',
        content: userInput
    });
    await createChatCompletion();
});