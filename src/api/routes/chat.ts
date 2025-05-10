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
            // console.log('[DEBUG] All headers:', request.headers);
            // console.log('[DEBUG] Raw authorization:', request.headers.authorization);
            request
                .validate('body.conversation_id', v => _.isUndefined(v) || _.isString(v))
                .validate('body.messages', _.isArray)
                .validate('headers.authorization', v => _.isUndefined(v) || _.isString(v))
            // Use environment token if available; otherwise, use client variable
            if (CHAT_AUTHORIZATION) {
                request.headers.authorization = "Bearer " + CHAT_AUTHORIZATION;
            }
            // token切分
            const tokens = chat.tokenSplit(request.headers.authorization);
            // 随机挑选一个token
            const token = _.sample(tokens);
            
            // console.log('[DEBUG] CHAT_AUTHORIZATION:', CHAT_AUTHORIZATION);
            // console.log('[DEBUG] Using authHeader:', request.headers.authorization);
            // console.log('[DEBUG] Tokens:', tokens);
            // console.log('[DEBUG] Token:', token);
            
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
