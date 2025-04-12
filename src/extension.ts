import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const outputChannel = vscode.window.createOutputChannel('MeowrchCodeTheme');

export function activate(context: vscode.ExtensionContext) {
    outputChannel.appendLine('Extension activated');

    // Пути к файлам
    const homeDir = os.homedir();
    const customThemePath = path.join(homeDir, '.config', 'meowrch-code-theme', 'theme.json');
    const extensionThemePath = path.join(context.extensionPath, 'themes', 'theme.json');

    // Флаг для защиты от рекурсии
    let isProcessing = false;
    let lastHash = '';

    // Функция для вычисления хэша содержимого файла
    const getFileHash = (filePath: string) => {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch {
            return '';
        }
    };

    // Функция для копирования темы
    const syncTheme = async () => {
        if (isProcessing) {
            outputChannel.appendLine('Sync already in progress, skipping');
            return;
        }

        isProcessing = true;
        try {
            const currentHash = getFileHash(customThemePath);
            
            // Если содержимое не изменилось - пропускаем
            if (currentHash === lastHash) {
                outputChannel.appendLine('File content unchanged, skipping');
                return;
            }

            outputChannel.appendLine('Syncing theme...');
            const customThemeContent = fs.readFileSync(customThemePath, 'utf8');
            
            // Проверяем валидность перед записью
            JSON.parse(customThemeContent);
            
            // Создаем директорию если нужно
            if (!fs.existsSync(path.dirname(extensionThemePath))) {
                fs.mkdirSync(path.dirname(extensionThemePath), { recursive: true });
            }
            
            fs.writeFileSync(extensionThemePath, customThemeContent);
            lastHash = currentHash;
            outputChannel.appendLine('Theme synced successfully');

            vscode.commands.executeCommand('workbench.action.reloadWindow');
        } catch (error) {
            outputChannel.appendLine(`ERROR syncing theme: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            isProcessing = false;
        }
    };

    // Проверяем наличие файла при старте
    if (!fs.existsSync(customThemePath)) {
        outputChannel.appendLine(`Custom theme file not found at: ${customThemePath}`);
        return;
    }

    // Создаем watcher
    let watcher: fs.FSWatcher;
    try {
        // Получаем начальный хэш
        lastHash = getFileHash(customThemePath);

        // Первая синхронизация с задержкой
        setTimeout(syncTheme, 1000);

        watcher = fs.watch(customThemePath, (eventType) => {
            if (eventType === 'change') {
                outputChannel.appendLine('Detected theme file change');
                syncTheme();
            }
        });

        context.subscriptions.push({
            dispose: () => {
                watcher.close();
                outputChannel.appendLine('File watcher closed');
            }
        });

    } catch (error) {
        outputChannel.appendLine(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export function deactivate() {
    outputChannel.appendLine('Extension deactivated');
    outputChannel.dispose();
}
