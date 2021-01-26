
const vscode = acquireVsCodeApi();

const app = new Vue({
    el: '#app',
    data: {
        type: JSON.parse(tplUsing),
        tplList: JSON.parse(tplList),
        typeArray: ['Github', 'Zoho']
    },
    filters: {},
    created() {
        const previousState = vscode.getState();
        let type = previousState ? previousState.type : JSON.parse(tplUsing);
        this.type = type;
    },
    methods: {
        submitTemplateOrigin: function (type) {
            this.type = type;
            vscode.setState({ type });
            vscode.postMessage({
                command: 'changeTplOrigin',
                origin: type,
            });
        }
    }
});