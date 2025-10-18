import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting AI update process...');
    
    // Get the absolute path to the incremental ingestion script
    const scriptPath = path.join(process.cwd(), 'ingest_incremental.py');
    
    // Run the ingestion script
    const { stdout, stderr } = await execAsync(
      `cd ${process.cwd()} && ./venv/bin/python ${scriptPath}`,
      { 
        timeout: 300000, // 5 minute timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }
    );
    
    console.log('📊 Ingestion completed');
    console.log('STDOUT:', stdout);
    
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    
    // Parse the output to extract summary information
    const summary = extractSummaryFromOutput(stdout);
    
    return NextResponse.json({
      success: true,
      message: 'AI updated successfully',
      summary: summary,
      output: stdout
    });
    
  } catch (error: any) {
    console.error('❌ AI update failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'AI update failed',
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    }, { status: 500 });
  }
}

function extractSummaryFromOutput(output: string) {
  // Look for the final summary in the output
  const summaryMatch = output.match(/📊 COMPREHENSIVE INGESTION SUMMARY[\s\S]*?📁 Files attempted: (\d+)[\s\S]*?✅ Files successful: (\d+)[\s\S]*?❌ Files failed: (\d+)/);
  
  if (summaryMatch) {
    return {
      filesAttempted: parseInt(summaryMatch[1]),
      filesSuccessful: parseInt(summaryMatch[2]),
      filesFailed: parseInt(summaryMatch[3]),
      successRate: `${((parseInt(summaryMatch[2]) / parseInt(summaryMatch[1])) * 100).toFixed(1)}%`
    };
  }
  
  // Fallback: try to extract basic stats
  const successfulMatch = output.match(/✅ Files successful: (\d+)/);
  const failedMatch = output.match(/❌ Files failed: (\d+)/);
  
  if (successfulMatch && failedMatch) {
    const successful = parseInt(successfulMatch[1]);
    const failed = parseInt(failedMatch[1]);
    const total = successful + failed;
    
    return {
      filesAttempted: total,
      filesSuccessful: successful,
      filesFailed: failed,
      successRate: total > 0 ? `${((successful / total) * 100).toFixed(1)}%` : '0%'
    };
  }
  
  return null;
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Update API endpoint. Use POST to trigger ingestion.',
    availableMethods: ['POST']
  });
}
