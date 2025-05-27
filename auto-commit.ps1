# Auto-commit and push script

# Function to get current git status
function Get-GitStatus {
    return git status --porcelain
}

# Function to commit and push changes
function Auto-Commit {
    $status = Get-GitStatus
    
    if ($status) {
        # Get modified files
        $files = $status -split '\n' | Where-Object { $_ -match '^M' } | ForEach-Object { $_ -split ' ' | Select-Object -Last 1 }
        
        # Add modified files
        git add $files
        
        # Create commit message
        $commitMessage = "Auto-commit: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        
        # Commit changes
        git commit -m $commitMessage
        
        # Push changes
        git push origin master
        
        Write-Host "Auto-commit and push completed successfully" -ForegroundColor Green
    }
    else {
        Write-Host "No changes to commit" -ForegroundColor Yellow
    }
}

# Run auto-commit
echo "Starting auto-commit..."
Auto-Commit
