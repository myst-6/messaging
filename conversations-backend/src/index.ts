import { CounterObject } from './objects/counter';
import { ThingsObject } from './objects/things';
import { ConversationObject } from './objects/conversation';
import router from './routes/router';

// export all DO classes
export { CounterObject, ThingsObject, ConversationObject };

// export the router worker as default
export default router satisfies ExportedHandler<Env>;
