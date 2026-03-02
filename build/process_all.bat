@echo off
setlocal enabledelayedexpansion

:: 1. CREATE OUTPUT FOLDER
if not exist "output_gifs" mkdir "output_gifs"

:: 2. SET PYMOL PATH
:: Make sure this matches your installation (as we found in the previous step)
set PYMOL_PATH="C:\Program Files\PyMOL\PyMOLWin.exe"

echo Starting batch processing for GIFs...

:: 3. LOOP THROUGH ALL PDB FILES
for %%f in (*.pdb) do (
    echo Processing %%f...
    
    :: EXPLANATION OF COMMANDS:
    :: mset 1 x60            -> Sets up a movie with 60 frames
    :: util.mroll 1, 60, 1   -> Tells PyMOL to rotate the view 360 degrees over those 60 frames
    :: set ray_trace_frames  -> Ensures every frame has high-quality shadows
    :: movie.produce         -> Exports the result as a .gif file

    %PYMOL_PATH% -c -d "load %%f; hide all; show cartoon; color gray80; select my_sites, resi 42+45; show sticks, my_sites; color red, my_sites; util.cbag my_sites; distance dist1, (resi 42 and name CA), (resi 45 and name CA); color yellow, dist1; set dash_gap, 0.2; set dash_width, 3.0; hide labels, dist1; zoom my_sites; set ray_opaque_background, 0; mset 1 x60; util.mroll 1, 60, 1; set ray_trace_frames, 1; movie.produce output_gifs/%%~nf.gif, mode=gif"
)

echo All done! Animated GIFs are in the 'output_gifs' folder.
pause