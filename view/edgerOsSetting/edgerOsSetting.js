
const vscode = acquireVsCodeApi();

const app = new Vue({
    el: '#app',
    data: {
        type: tplUsing,
        tplList: JSON.parse(tplList),
        typeArray: [{
            title: 'Github',
            value: 'github'
        }, {
            title: 'Zoho',
            value: 'zoho'
        }]
    },
    filters: {},
    created() {
        const previousState = vscode.getState();
        let type = previousState ? previousState.type : tplUsing;
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