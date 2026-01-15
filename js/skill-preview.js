/**
 * SLOP - Simple Locally Optimized Prompts
 * Skill Preview Component
 * 
 * Handles parsing and displaying multi-file skill output in a tabbed interface.
 * Also provides ZIP export functionality for skills.
 */

const SkillPreview = {
    // File marker patterns
    FILE_START_PATTERN: /^={5} FILE: (.+?) ={5}$/m,
    FILE_END_PATTERN: /^={5} END_OF_SKILL ={5}$/m,

    /**
     * Parse skill output into individual files
     * @param {string} content - The raw skill output
     * @returns {Array<{name: string, content: string}>} Array of file objects
     */
    parseSkillOutput(content) {
        const files = [];
        
        // Check if content uses the multi-file format
        if (!content.includes('===== FILE:')) {
            // Single file format - treat as SKILL.md
            return [{ name: 'SKILL.md', content: content.trim() }];
        }

        // Extract file sections
        const lines = content.split('\n');
        let currentFile = null;
        let currentContent = [];

        for (const line of lines) {
            const fileMatch = line.match(/^={5} FILE: (.+?) ={5}$/);
            const endMatch = line.match(/^={5} END_OF_SKILL ={5}$/);

            if (fileMatch) {
                // Save previous file if exists
                if (currentFile) {
                    files.push({
                        name: currentFile,
                        content: currentContent.join('\n').trim()
                    });
                }
                // Start new file
                currentFile = fileMatch[1];
                currentContent = [];
            } else if (endMatch) {
                // Save final file
                if (currentFile) {
                    files.push({
                        name: currentFile,
                        content: currentContent.join('\n').trim()
                    });
                }
                break;
            } else if (currentFile) {
                currentContent.push(line);
            }
        }

        // Handle case where END_OF_SKILL wasn't found
        if (currentFile && currentContent.length > 0) {
            files.push({
                name: currentFile,
                content: currentContent.join('\n').trim()
            });
        }

        return files;
    },

    /**
     * Get skill name from SKILL.md content
     * @param {string} content - SKILL.md content
     * @returns {string} The skill name or 'new-skill'
     */
    getSkillName(content) {
        const match = content.match(/^---[\s\S]*?name:\s*([^\n]+)[\s\S]*?---/m);
        return match ? match[1].trim() : 'new-skill';
    },

    /**
     * Check if content looks like a skill (has skill file markers or skill frontmatter)
     * @param {string} content - The content to check
     * @returns {boolean} True if content appears to be a skill
     */
    isSkillContent(content) {
        if (content.includes('===== FILE:')) return true;
        // Check for skill frontmatter pattern
        const frontmatterMatch = content.match(/^---[\s\S]*?name:\s*[^\n]+[\s\S]*?description:[\s\S]*?Triggers on:[\s\S]*?---/m);
        return !!frontmatterMatch;
    },

    /**
     * Export skill files as a ZIP
     * @param {string} content - The raw skill output
     * @returns {Promise<Blob>} The ZIP file blob
     */
    async exportAsZip(content) {
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded');
        }

        const files = this.parseSkillOutput(content);
        if (files.length === 0) {
            throw new Error('No files to export');
        }

        const skillName = this.getSkillName(files[0].content);
        const zip = new JSZip();

        // Create folder structure
        const skillFolder = zip.folder(skillName);

        for (const file of files) {
            if (file.name.startsWith('references/')) {
                // Handle references subfolder
                const refFolder = skillFolder.folder('references');
                const fileName = file.name.replace('references/', '');
                refFolder.file(fileName, file.content);
            } else {
                skillFolder.file(file.name, file.content);
            }
        }

        return await zip.generateAsync({ type: 'blob' });
    },

    /**
     * Download skill as ZIP
     * @param {string} content - The raw skill output
     */
    async downloadAsZip(content) {
        try {
            const blob = await this.exportAsZip(content);
            const files = this.parseSkillOutput(content);
            const skillName = this.getSkillName(files[0].content);
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${skillName}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export skill:', error);
            alert('Failed to export skill: ' + error.message);
        }
    },

    /**
     * Create tabbed UI for skill files
     * @param {string} content - The raw skill output
     * @param {HTMLElement} container - Container to render tabs into
     * @param {function} onTabChange - Callback when tab changes (receives file content)
     * @returns {Object} Controller object with methods to interact with tabs
     */
    createTabs(content, container, onTabChange) {
        const files = this.parseSkillOutput(content);
        
        if (files.length <= 1) {
            container.classList.remove('visible');
            return null;
        }

        container.innerHTML = '';
        container.classList.add('visible');

        let activeIndex = 0;

        files.forEach((file, index) => {
            const tab = document.createElement('button');
            tab.className = 'skill-tab' + (index === 0 ? ' active' : '');
            
            // Icon based on file type
            const icon = file.name === 'SKILL.md' ? 'fa-file-code' : 'fa-file-alt';
            tab.innerHTML = `<i class="fa-regular ${icon} file-icon"></i>${file.name}`;
            
            tab.addEventListener('click', () => {
                container.querySelectorAll('.skill-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeIndex = index;
                if (onTabChange) {
                    onTabChange(file.content, file.name, index);
                }
            });
            
            container.appendChild(tab);
        });

        return {
            getActiveIndex: () => activeIndex,
            getFiles: () => files,
            setActiveTab: (index) => {
                const tabs = container.querySelectorAll('.skill-tab');
                if (tabs[index]) {
                    tabs[index].click();
                }
            }
        };
    }
};
