"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = void 0;
const vscode_languageserver_1 = require("vscode-languageserver");
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const wasm_1 = require("./wasm");
/**
* Starts the language server.
*
* @param options Options to customize behavior
*/
function startServer(options) {
    // Create a connection for the server, using Node's IPC as a transport.
    // Also include all preview / proposed LSP features.
    const connection = (0, node_1.createConnection)(vscode_languageserver_1.ProposedFeatures.all);
    // Create a simple text document manager.
    const documents = new vscode_languageserver_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
    let hasConfigurationCapability = false;
    let hasWorkspaceFolderCapability = false;
    let hasDiagnosticRelatedInformationCapability = false;
    connection.onInitialize((params) => {
        // Logging first...
        connection.console.info(`Teo langauge server started`);
        const capabilities = params.capabilities;
        // Does the client support the `workspace/configuration` request?
        // If not, we fall back using global settings.
        hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
        hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
        hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
            capabilities.textDocument.publishDiagnostics &&
            capabilities.textDocument.publishDiagnostics.relatedInformation);
        const result = {
            capabilities: {
                textDocumentSync: vscode_languageserver_1.TextDocumentSyncKind.Full,
                definitionProvider: true,
                //documentFormattingProvider: true,
                //completionProvider: {
                //    resolveProvider: true,
                //    triggerCharacters: ['@', '"', '.'],
                //},
                //hoverProvider: true,
                //renameProvider: true,
                //documentSymbolProvider: true,
            },
        };
        if (hasWorkspaceFolderCapability) {
            result.capabilities.workspace = {
                workspaceFolders: {
                    supported: true
                }
            };
        }
        return result;
    });
    connection.onInitialized(() => {
        if (hasConfigurationCapability) {
            // Register for all configuration changes.
            connection.client.register(vscode_languageserver_1.DidChangeConfigurationNotification.type, undefined);
        }
        if (hasWorkspaceFolderCapability) {
            connection.workspace.onDidChangeWorkspaceFolders(_event => {
                connection.console.log('Workspace folder change event received.');
            });
        }
    });
    // The global settings, used when the `workspace/configuration` request is not supported by the client or is not set by the user.
    // This does not apply to VS Code, as this client supports this setting.
    // const defaultSettings: LSSettings = {}
    // let globalSettings: LSSettings = defaultSettings // eslint-disable-line
    // Cache the settings of all open documents
    const documentSettings = new Map();
    connection.onDidChangeConfiguration((_change) => {
        connection.console.info('Configuration changed.');
        if (hasConfigurationCapability) {
            // Reset all cached document settings
            documentSettings.clear();
        }
        // Revalidate all open teo schemas
        documents.all().forEach(validateTextDocumentAndSendDiagnostics, documents); // eslint-disable-line @typescript-eslint/no-misused-promises
    });
    // Only keep settings for open documents
    documents.onDidClose((e) => {
        documentSettings.delete(e.document.uri);
    });
    documents.onDidChangeContent((change) => {
        validateTextDocumentAndSendDiagnostics(change.document);
    });
    // Note: VS Code strips newline characters from the message
    function showErrorToast(errorMessage) {
        connection.window.showErrorMessage(errorMessage);
    }
    function validateTextDocumentAndSendDiagnostics(textDocument) {
        const diagnostics = (0, wasm_1.validateTextDocument)(textDocument, documents.all());
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    }
    function getDocument(uri) {
        return documents.get(uri);
    }
    connection.onDefinition((params) => {
        return (0, wasm_1.findDefinitionsAtPosition)(params.textDocument.uri, documents.all(), params.position);
    });
    // connection.onCompletion((params: CompletionParams) => {
    //   const doc = getDocument(params.textDocument.uri)
    //   if (doc) {
    //     return MessageHandler.handleCompletionRequest(params, doc, showErrorToast)
    //   }
    // })
    // // This handler resolves additional information for the item selected in the completion list.
    // connection.onCompletionResolve((completionItem: CompletionItem) => {
    //   return MessageHandler.handleCompletionResolveRequest(completionItem)
    // })
    // Unused now
    // TODO remove or experiment new file watcher
    connection.onDidChangeWatchedFiles(() => {
        // Monitored files have changed in VS Code
        connection.console.log(`Types have changed. Sending request to restart TS Language Server.`);
        // Restart TS Language Server
        void connection.sendNotification('teo/didChangeWatchedFiles', {});
    });
    // connection.onHover((params: HoverParams) => {
    //   const doc = getDocument(params.textDocument.uri)
    //   if (doc) {
    //     return MessageHandler.handleHoverRequest(doc, params)
    //   }
    // })
    // connection.onDocumentFormatting((params: DocumentFormattingParams) => {
    //   const doc = getDocument(params.textDocument.uri)
    //   if (doc) {
    //     return MessageHandler.handleDocumentFormatting(params, doc, showErrorToast)
    //   }
    // })
    // connection.onCodeAction((params: CodeActionParams) => {
    //   const doc = getDocument(params.textDocument.uri)
    //   if (doc) {
    //     return MessageHandler.handleCodeActions(params, doc, showErrorToast)
    //   }
    // })
    // connection.onRenameRequest((params: RenameParams) => {
    //   const doc = getDocument(params.textDocument.uri)
    //   if (doc) {
    //     return MessageHandler.handleRenameRequest(params, doc)
    //   }
    // })
    // connection.onDocumentSymbol((params: DocumentSymbolParams) => {
    //   const doc = getDocument(params.textDocument.uri)
    //   if (doc) {
    //     return MessageHandler.handleDocumentSymbol(params, doc)
    //   }
    // })
    // Make the text document manager listen on the connection
    // for open, change and close text document events
    documents.listen(connection);
    connection.listen();
}
exports.startServer = startServer;
//# sourceMappingURL=server.js.map