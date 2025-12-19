/**
 * Prompt Library - IndexedDB storage for optimized prompts
 * Provides permanent local storage with search by name
 */
class PromptLibrary {
    constructor() {
        this.dbName = 'slop_prompt_library';
        this.dbVersion = 2;
        this.storeName = 'prompts';
        this.db = null;
    }

    /**
     * Initialize the IndexedDB database
     * @returns {Promise<IDBDatabase>}
     */
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open prompt library database:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create prompts object store
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    // Create indexes for searching
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('created', 'created', { unique: false });
                    store.createIndex('updated', 'updated', { unique: false });
                }
            };
        });
    }

    /**
     * Parse YAML frontmatter from markdown content
     * @param {string} content - Markdown content with YAML frontmatter
     * @returns {Object} - { name, description, body }
     */
    parseYamlFrontmatter(content) {
        const result = {
            name: 'Untitled Prompt',
            description: '',
            body: content
        };

        const match = content.match(/^\s*---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/);
        if (match) {
            try {
                const yamlText = match[1];
                const body = match[2];

                // Security check for YAML size
                if (yamlText.length > 50000) {
                    console.warn('YAML content too large, skipping parse');
                    return result;
                }

                const data = jsyaml.load(yamlText);

                if (data && typeof data === 'object') {
                    if (data.name) result.name = String(data.name).trim();
                    if (data.description) result.description = String(data.description).trim();
                }
                result.body = body.trim();
            } catch (e) {
                console.warn('No YAML frontmatter found or failed to parse YAML frontmatter:', e);
            }
        }

        return result;
    }

    /**
     * Ensure the database is open before performing operations
     * @private
     */
    _ensureDb() {
        if (!this.db) {
            throw new Error('Prompt library database is not initialized. Please check if IndexedDB is supported and enabled.');
        }
    }

    /**
     * Generate a unique name by appending (1), (2), etc. if name exists
     * @param {string} baseName - The desired name
     * @returns {Promise<string>} - Unique name
     */
    async generateUniqueName(baseName) {
        this._ensureDb();
        const allPrompts = await this.getAllPrompts();
        const existingNames = allPrompts.map(p => p.name.toLowerCase());

        if (!existingNames.includes(baseName.toLowerCase())) {
            return baseName;
        }

        let counter = 1;
        let newName = `${baseName} (${counter})`;

        while (existingNames.includes(newName.toLowerCase())) {
            counter++;
            newName = `${baseName} (${counter})`;
        }

        return newName;
    }

    /**
     * Save a new prompt to the library
     * @param {string} content - Full markdown content with YAML frontmatter
     * @param {boolean} autoUniqueName - Whether to auto-generate unique name
     * @returns {Promise<number>} - The new prompt's ID
     */
    async savePrompt(content, autoUniqueName = true) {
        this._ensureDb();
        const parsed = this.parseYamlFrontmatter(content);

        let name = parsed.name;
        let finalContent = content;

        if (autoUniqueName) {
            const uniqueName = await this.generateUniqueName(name);
            if (uniqueName !== name) {
                // Replace name in frontmatter while preserving rest of content
                finalContent = content.replace(
                    /^(---[\s\S]*?name:\s*).+?([\s\S]*?---)/,
                    `$1${uniqueName}$2`
                );
                name = uniqueName;
            }
        }

        const prompt = {
            name: name,
            description: parsed.description,
            content: finalContent,
            created: Date.now(),
            updated: Date.now()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(prompt);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a prompt by ID
     * @param {number} id - Prompt ID
     * @returns {Promise<Object|null>}
     */
    async getPrompt(id) {
        this._ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all prompts from the library
     * @returns {Promise<Array>}
     */
    async getAllPrompts() {
        this._ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete a prompt by ID
     * @param {number} id - Prompt ID
     * @returns {Promise<void>}
     */
    async deletePrompt(id) {
        this._ensureDb();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
