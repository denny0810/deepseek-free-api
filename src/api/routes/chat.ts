import _ from 'lodash';

import Request from '@/lib/request/Request.ts';
import Response from '@/lib/response/Response.ts';
import chat from '@/api/controllers/chat.ts';
import process from "process";


const CHAT_AUTHORIZATION = process.env.CHAT_AUTHORIZATION;

export default {

    prefix: '/v1/chat',

    post: {

        '/completions': async (request: Request) => {
            request
                .validate('body.conversation_id', v => _.isUndefined(v) || _.isString(v))
                .validate('body.messages', _.isArray)
                .validate('headers.authorization', v => _.isUndefined(v) || _.isString(v))

            // Use client-provided token if available; otherwise, use environment variable
            const authHeader = request.headers.authorization || 
                             (CHAT_AUTHORIZATION ? `Bearer ${CHAT_AUTHORIZATION}` : null);
            
            if (!authHeader) {
                throw new Error('Authorization header or environment variable must be provided');
            }
            
            // token切分
            const tokens = chat.tokenSplit(authHeader);
            // 随机挑选一个token
            const token = _.sample(tokens);
            let { model, conversation_id: convId, messages, stream } = request.body;
            model = model.toLowerCase();
            if (stream) {
                const stream = await chat.createCompletionStream(model, messages, token, convId);
                return new Response(stream, {
                    type: "text/event-stream"
                });
            }
            else
                return await chat.createCompletion(model, messages, token, convId);
        }

    }

}
