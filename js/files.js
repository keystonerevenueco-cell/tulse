// ==========================
// FILE SYSTEM
// ==========================

// ==========================
// UPLOAD FILE
// ==========================

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const fileData = {
                id: Date.now(),
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result,
                uploadDate: new Date().toISOString()
            };
            
            // Store in localStorage (base64 encoded)
            const files = JSON.parse(localStorage.getItem('tulse_project_files') || '[]');
            files.push(fileData);
            localStorage.setItem('tulse_project_files', JSON.stringify(files));
            
            resolve(fileData);
        };
        
        reader.onerror = function() {
            reject('Failed to read file');
        };
        
        reader.readAsDataURL(file);
    });
}

// ==========================
// GET FILES
// ==========================

function getProjectFiles() {
    return JSON.parse(localStorage.getItem('tulse_project_files') || '[]');
}

// ==========================
// DELETE FILE
// ==========================

function deleteFile(fileId) {
    const files = JSON.parse(localStorage.getItem('tulse_project_files') || '[]');
    const updated = files.filter(f => f.id !== fileId);
    localStorage.setItem('tulse_project_files', JSON.stringify(updated));
    updateFileDisplay();
}

// ==========================
// UPDATE FILE DISPLAY
// ==========================

function updateFileDisplay() {
    const fileContainer = document.getElementById('fileContainer');
    if (!fileContainer) return;
    
    const files = getProjectFiles();
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    
    let html = '';
    files.forEach(file => {
        const size = file.size < 1024 ? file.size + ' B' : 
                     file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : 
                     (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        
        const icon = file.type.includes('pdf') ? 'fa-file-pdf' :
                    file.type.includes('excel') || file.type.includes('spreadsheet') ? 'fa-file-excel' :
                    file.type.includes('word') ? 'fa-file-word' :
                    file.type.includes('image') ? 'fa-file-image' : 'fa-file';
        
        html += `
            <div style="display: flex; align-items: center; gap: 15px; padding: 12px 15px; background: #f8fafc; border-radius: 10px; margin-bottom: 10px; border: 1px solid #e5e7eb;">
                <i class="fas ${icon}" style="font-size: 1.5rem; color: var(--accent-color);"></i>
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 0.95rem;">${file.name}</div>
                    <div style="font-size: 0.8rem; color: #64748b;">${size}</div>
                </div>
                <a href="${file.data}" download="${file.name}" class="download-btn" style="padding: 6px 16px; border-radius: 8px; background: var(--accent-color); color: #000; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer; text-decoration: none; transition: all 0.3s ease;">
                    Download
                </a>
                ${isAdmin ? `<button onclick="deleteFile(${file.id})" style="padding: 6px 12px; border-radius: 8px; background: #ef4444; color: white; font-weight: 600; font-size: 0.8rem; border: none; cursor: pointer;">Delete</button>` : ''}
            </div>
        `;
    });
    
    fileContainer.innerHTML = html;
}

// ==========================
// INIT FILES
// ==========================

function initFiles() {
    const uploadBtn = document.getElementById('uploadFileBtn');
    const fileInput = document.getElementById('fileInput');
    const fileContainer = document.getElementById('fileContainer');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadFile(file).then(() => {
                    updateFileDisplay();
                    fileInput.value = '';
                });
            }
        });
    }
    
    updateFileDisplay();
}

document.addEventListener('DOMContentLoaded', function() {
    initFiles();
});
// ==========================
// ADMIN FILE MANAGEMENT
// ==========================

function getFileStats() {
    const files = getProjectFiles();
    return {
        total: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0)
    };
}

// Add to existing initFiles function
function initFiles() {
    const uploadBtn = document.getElementById('uploadFileBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadFile(file).then(() => {
                    updateFileDisplay();
                    fileInput.value = '';
                    if (typeof updateAdminDashboard === 'function') {
                        updateAdminDashboard();
                    }
                });
            }
        });
    }
    
    updateFileDisplay();
}