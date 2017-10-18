
class EditorProcedure {
    constructor() {
        this.id = "";
        this._constructorName = "EditorProcedure";
    }

    getProcedure(module) {
        return function() {};
    }
}

class CustomEditorProcedure extends EditorProcedure {
    constructor() {
        super();
        this.procedureText = "";
        
        this._constructorName = "CustomEditorProcedure";
    }

    getProcedure(module) {
        return function() {eval(this.procedureText)};
    }
}

