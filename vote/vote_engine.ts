import {Context} from "../search/config";

export class VoteEngine {
    context: Context
    constructor(context: Context) {
        context.voteEngine = this;
        this.context = context;
    }

    getVotesByContext(section?: string, utility?: string){
        let filters = {};
        if( section ) filters = {...filters, section}
        if( utility ) filters = {...filters, utility}

        return this.context.dictionaryEngine.getDict('dict_votes', filters);
    }
}
