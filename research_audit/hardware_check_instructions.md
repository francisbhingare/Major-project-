# Hardware and Environment Specification Collection Guide

**Target Audience:** Undergraduate Final-Year Student  
**Purpose:** Collect exact hardware and system specifications for the **"Experimental Setup & System Configuration"** section of your research paper and final project report.

Academic papers require an accurate description of the testbed environment so other researchers can evaluate system latency, memory utilization, and throughput.

---

## Method 1: The Quick PowerShell Command (Fastest & Most Accurate)

You can collect all required hardware specifications in 5 seconds using Windows PowerShell.

### Step-by-Step Instructions:
1. Press `Win + X` on your keyboard and click **Terminal** or **Windows PowerShell**.
2. Copy and paste the following single command block and press **Enter**:

```powershell
Write-Host "================ SYSTEM SPECIFICATION AUDIT ================" -ForegroundColor Cyan
$os = Get-CimInstance Win32_OperatingSystem
$cpu = Get-CimInstance Win32_Processor
$cs = Get-CimInstance Win32_ComputerSystem
$gpu = Get-CimInstance Win32_VideoController
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"

Write-Host "Computer Model: " -NoNewline; Write-Host $cs.Manufacturer $cs.Model -ForegroundColor Yellow
Write-Host "Operating System: " -NoNewline; Write-Host $os.Caption "($($os.OSArchitecture)) Build $($os.BuildNumber)" -ForegroundColor Yellow
Write-Host "Processor (CPU): " -NoNewline; Write-Host $cpu.Name -ForegroundColor Yellow
Write-Host "CPU Cores/Threads: " -NoNewline; Write-Host "$($cpu.NumberOfCores) Cores / $($cpu.NumberOfLogicalProcessors) Threads" -ForegroundColor Yellow
Write-Host "Physical RAM: " -NoNewline; Write-Host "$([Math]::Round($cs.TotalPhysicalMemory / 1GB, 2)) GB" -ForegroundColor Yellow
foreach ($g in $gpu) {
    Write-Host "Graphics (GPU): " -NoNewline; Write-Host "$($g.Name) (Driver: $($g.DriverVersion))" -ForegroundColor Yellow
}
Write-Host "Storage (C: Drive): " -NoNewline; Write-Host "$([Math]::Round(($disk.Size - $disk.FreeSpace) / 1GB, 1)) GB used of $([Math]::Round($disk.Size / 1GB, 1)) GB total" -ForegroundColor Yellow

$nodeVer = node -v 2>$null
$npmVer = npm -v 2>$null
Write-Host "`n================ SOFTWARE RUNTIMES ================" -ForegroundColor Cyan
Write-Host "Node.js Version: " -NoNewline; Write-Host ($nodeVer ? $nodeVer : "Not in PATH") -ForegroundColor Yellow
Write-Host "NPM Version: " -NoNewline; Write-Host ($npmVer ? $npmVer : "Not in PATH") -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
```

---

## Method 2: Visual Inspection via Windows GUI (No Terminal Required)

If you prefer clicking through Windows menus:

### 1. Processor (CPU) and RAM:
1. Press `Ctrl + Shift + Esc` to open **Task Manager**.
2. Click on the **Performance** tab on the left sidebar.
3. Click **CPU**: Note down the full processor model in the top right (e.g., *12th Gen Intel Core i5-12450H* or *AMD Ryzen 7 5800H*), the base speed, and core count.
4. Click **Memory**: Note down the total RAM capacity (e.g., *16.0 GB DDR4*).

### 2. Graphics Processing Unit (GPU):
1. In Task Manager under **Performance**, scroll down to **GPU 0** (and **GPU 1** if you have a dedicated graphics card like NVIDIA RTX).
2. Note down the model name and dedicated GPU memory (e.g., *NVIDIA GeForce RTX 3050 Laptop GPU 4 GB GDDR6*).

### 3. Display Resolution:
1. Right-click anywhere on your desktop and select **Display settings**.
2. Note the **Display resolution** (e.g., *1920 x 1080 Full HD*).

---

## Method 3: Node.js Diagnostic Command

You can also run this command directly inside your project directory to see the exact environment running your web server:

```bash
node -e "console.log({ platform: process.platform, arch: process.arch, node: process.version, cpus: require('os').cpus().length, totalMemGB: (require('os').totalmem() / 1e9).toFixed(2), freeMemGB: (require('os').freemem() / 1e9).toFixed(2) })"
```

---

## Ready-to-Use Research Paper Table Template

Once you have run the commands above, fill in the values below and copy-paste this table directly into **Chapter 3 (System Implementation & Experimental Setup)** of your final project report:

### Table 3.1: Experimental Testbed Specifications

| Hardware / Software Component | Specification in Test Environment |
|---|---|
| **Host System Model** | *[Insert Laptop Manufacturer and Model, e.g., HP Victus 15]* |
| **Central Processing Unit (CPU)** | *[Insert CPU Name, e.g., AMD Ryzen 5 5600H @ 3.30 GHz (6 Cores / 12 Threads)]* |
| **System Memory (RAM)** | *[Insert RAM, e.g., 16.00 GB DDR4 3200 MHz]* |
| **Graphics Processing Unit (GPU)** | *[Insert GPU, e.g., NVIDIA GeForce RTX 3050 (4 GB) / Intel Iris Xe]* |
| **Primary Storage** | *[Insert Storage Type, e.g., 512 GB PCIe NVMe M.2 SSD]* |
| **Operating System** | Windows 11 Home / Pro (64-bit) |
| **Client Display Resolution** | 1920 × 1080 (16:9 Aspect Ratio) |
| **Network Interface** | Wi-Fi 6 (802.11ax) / Gigabit Ethernet |
| **JavaScript Runtime** | Node.js v20.x (V8 Engine) |
| **Package Manager** | NPM v10.x |
| **Development Web Server** | Next.js 15.3.3 Development Server (HTTP/1.1) |
| **Embedded Database Engine** | SQLite 3 via `better-sqlite3` v11.8.1 (WAL Mode) |
