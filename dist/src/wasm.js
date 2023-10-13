"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completionItemsAtPosition = exports.findDefinitionsAtPosition = exports.validateTextDocument = exports.removeCachedSchema = void 0;
const teo_language_server_wasm_1 = require("@teocloud/teo-language-server-wasm");
const vscode_languageserver_1 = require("vscode-languageserver");
const path_1 = __importDefault(require("path"));
function removeCachedSchema(uri) {
    (0, teo_language_server_wasm_1.remove_cached_schema)(uri);
}
exports.removeCachedSchema = removeCachedSchema;
function validateTextDocument(document, documents) {
    const unsavedFiles = {};
    documents.map((document) => {
        unsavedFiles[document.uri.replace('file://', '')] = document.getText();
    });
    const sanitizedUri = document.uri.replace('file://', '');
    const linterStringResult = (0, teo_language_server_wasm_1.lint)(sanitizedUri, unsavedFiles);
    const linterResult = JSON.parse(linterStringResult);
    return linterResult.filter((result) => {
        return result.source == sanitizedUri;
    }).map((result) => {
        return vscode_languageserver_1.Diagnostic.create(vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(result.span.start_position[0] - 1, result.span.start_position[1] - 1), vscode_languageserver_1.Position.create(result.span.end_position[0] - 1, result.span.end_position[1] - 1)), result.message, result.type == "error" ? vscode_languageserver_1.DiagnosticSeverity.Error : vscode_languageserver_1.DiagnosticSeverity.Warning);
    });
}
exports.validateTextDocument = validateTextDocument;
function findDefinitionsAtPosition(uri, position) {
    const sanitizedUri = uri.replace('file://', '');
    const results = (0, teo_language_server_wasm_1.find_definitions)(sanitizedUri, [position.line + 1, position.character + 1]);
    return results.map((result) => {
        return vscode_languageserver_1.LocationLink.create(result.path === "(builtin)std.teo" ? path_1.default.join(__dirname, "../dumps/builtin/std.teo") : result.path, vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(result.target_span.start_position[0] - 1, result.target_span.start_position[1] - 1), vscode_languageserver_1.Position.create(result.target_span.end_position[0] - 1, result.target_span.end_position[1] - 1)), vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(result.identifier_span.start_position[0] - 1, result.identifier_span.start_position[1] - 1), vscode_languageserver_1.Position.create(result.identifier_span.end_position[0] - 1, result.identifier_span.end_position[1] - 1)), vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(result.selection_span.start_position[0] - 1, result.selection_span.start_position[1] - 1), vscode_languageserver_1.Position.create(result.selection_span.end_position[0] - 1, result.selection_span.end_position[1] - 1)));
    });
}
exports.findDefinitionsAtPosition = findDefinitionsAtPosition;
function completionItemsAtPosition(uri, position, documents) {
    const unsavedFiles = {};
    documents.map((document) => {
        unsavedFiles[document.uri.replace('file://', '')] = document.getText();
    });
    const sanitizedUri = uri.replace('file://', '');
    const results = (0, teo_language_server_wasm_1.completion_items)(sanitizedUri, [position.line + 1, position.character + 1], unsavedFiles);
    return results.map((result) => {
        let item = vscode_languageserver_1.CompletionItem.create(result.label);
        item.documentation = result.documentation;
        item.detail = result.detail;
        item.labelDetails = {
            description: result.namespace_path,
        };
        return item;
    });
}
exports.completionItemsAtPosition = completionItemsAtPosition;
//# sourceMappingURL=wasm.js.map