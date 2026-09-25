import JSZip from "jszip";
import { ImageJob } from "./types";

export async function downloadZip(jobs: ImageJob[], filename: string = "bulk-footer-output.zip") {
  const completedJobs = jobs.filter(j => j.status === "completed" && j.outputUrl);
  if (completedJobs.length === 0) {
    alert("No completed images available to download.");
    return;
  }
  const zip = new JSZip();
  
  // We need to fetch the blob for each outputUrl
  const promises = jobs.map(async (job) => {
    if (job.status === "completed" && job.outputUrl) {
      try {
        const response = await fetch(job.outputUrl);
        const blob = await response.blob();
        
        // Ensure extension is correct based on blob type if necessary, or just use original name
        let name = job.originalName;
        const extMatch = name.match(/\.([^\.]+)$/);
        const ext = extMatch ? extMatch[1] : 'jpg';
        const base = extMatch ? name.substring(0, name.lastIndexOf('.')) : name;
        
        // Append footer suffix (could come from settings, assuming _footer for now)
        zip.file(`${base}_footer.${ext}`, blob);
      } catch (e) {
        console.error(`Failed to fetch blob for ${job.originalName}`, e);
      }
    }
  });

  await Promise.all(promises);

  const content = await zip.generateAsync({ type: "blob" });
  
  // Trigger download
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
