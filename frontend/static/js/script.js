document.addEventListener('DOMContentLoaded', function() {
    // Tab switching with animation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.style.opacity = '0.7';
            });
            this.classList.add('active');
            this.style.opacity = '1';
            
            // Update active tab content with animation
            tabContents.forEach(content => {
                if (content.classList.contains('active')) {
                    content.style.opacity = '0';
                    content.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        content.classList.remove('active');
                    }, 300);
                }
            });
            
            setTimeout(() => {
                const activeContent = document.getElementById(tabId);
                activeContent.classList.add('active');
                setTimeout(() => {
                    activeContent.style.opacity = '1';
                    activeContent.style.transform = 'translateY(0)';
                }, 10);
            }, 300);
        });
    });
    
    // File upload handling
    const fileUpload = document.getElementById('file-upload');
    const fileContent = document.getElementById('file-content');
    
    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = function(e) {
                fileContent.textContent = e.target.result;
                fileContent.style.borderColor = '#5e35b1';
            };
            reader.readAsText(file);
        } else {
            fileContent.textContent = 'Please upload a valid .txt file';
            fileContent.style.borderColor = '#e53935';
        }
    });
    
    // Summarize button functionality
    const summarizeBtn = document.getElementById('summarize-btn');
    const downloadBtn = document.getElementById('download-btn');
    const summaryOutput = document.getElementById('summary-output');
    
    summarizeBtn.addEventListener('click', async function() {
        const activeTab = document.querySelector('.tab-content.active').id;
        let text = '';
        
        if (activeTab === 'paste-tab') {
            text = document.getElementById('input-text').value;
            if (!text.trim()) {
                document.getElementById('input-text').style.borderColor = '#e53935';
                summaryOutput.textContent = 'Please enter some text to summarize.';
                return;
            }
        } else {
            text = fileContent.textContent;
            if (!text.trim() || text === 'Please upload a valid .txt file') {
                fileContent.style.borderColor = '#e53935';
                summaryOutput.textContent = 'Please upload a valid .txt file to summarize.';
                return;
            }
        }
        
        summaryOutput.textContent = 'Generating summary...';
        summarizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        summarizeBtn.disabled = true;
        
        try {
            let formData;
            if (activeTab === 'upload-tab' && fileUpload.files[0]) {
                formData = new FormData();
                formData.append('file', fileUpload.files[0]);
            } else {
                formData = JSON.stringify({ text: text });
            }
            
            const response = await fetch('/summarize', {
                method: 'POST',
                headers: activeTab === 'paste-tab' ? {
                    'Content-Type': 'application/json',
                } : {},
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Typewriter effect for summary
            const summary = data.summary;
            let i = 0;
            const speed = 20;
            summaryOutput.textContent = '';
            
            function typeWriter() {
                if (i < summary.length) {
                    summaryOutput.textContent += summary.charAt(i);
                    i++;
                    setTimeout(typeWriter, speed);
                }
            }
            
            typeWriter();
            
            downloadBtn.disabled = false;
            downloadBtn.style.transform = 'scale(1.1)';
            setTimeout(() => {
                downloadBtn.style.transform = 'scale(1)';
            }, 300);
            
        } catch (error) {
            console.error('Error:', error);
            summaryOutput.textContent = `Error: ${error.message}`;
            summaryOutput.style.color = '#e53935';
        } finally {
            summarizeBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Summary';
            summarizeBtn.disabled = false;
        }
    });
    
    // Download button functionality
    downloadBtn.addEventListener('click', async function() {
        const summary = summaryOutput.textContent;
        
        try {
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            downloadBtn.disabled = true;
            
            const response = await fetch('/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ summary: summary })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'summary.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            
            // Success animation
            downloadBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
            setTimeout(() => {
                downloadBtn.innerHTML = '<i class="fas fa-file-download"></i> Download';
            }, 2000);
        } catch (error) {
            console.error('Download error:', error);
            downloadBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
            setTimeout(() => {
                downloadBtn.innerHTML = '<i class="fas fa-file-download"></i> Download';
            }, 2000);
        } finally {
            downloadBtn.disabled = false;
        }
    });
});