MODULE sample_abb_welding

! Sample ABB RAPID program for welding operation
! This demonstrates typical RAPID syntax and robot movements

! Tool and work object declarations
PERS tooldata welding_torch := [TRUE, [[0, 0, 200], [1, 0, 0, 0]], [5, [0, 0, 50], [1, 0, 0, 0], 0, 0, 0]];
PERS wobjdata workpiece := [FALSE, TRUE, "", [[0, 0, 0], [1, 0, 0, 0]], [[0, 0, 0], [1, 0, 0, 0]]];

! Position declarations
CONST robtarget home_pos := [[600, 0, 600], [0, 0, 1, 0], [0, 0, 0, 0], [9E9, 9E9, 9E9, 9E9, 9E9, 9E9]];
CONST robtarget weld_start := [[400, 200, 150], [0, 0.707, 0.707, 0], [0, 0, 0, 0], [9E9, 9E9, 9E9, 9E9, 9E9, 9E9]];
CONST robtarget weld_end := [[600, 200, 150], [0, 0.707, 0.707, 0], [0, 0, 0, 0], [9E9, 9E9, 9E9, 9E9, 9E9, 9E9]];

! Speed and zone data
CONST speeddata v_fast := [1000, 500, 5000, 1000];
CONST speeddata v_med := [500, 60, 5000, 1000];
CONST speeddata v_slow := [100, 10, 5000, 1000];
CONST zonedata z_fine := [FALSE, 0.3, 0.3, 0.3, 0.03, 0.3, 0.03];
CONST zonedata z_coarse := [FALSE, 10, 15, 15, 0.15, 15, 0.15];

! Main procedure
PROC main()
    ! Initialize welding system
    welding_init;
    
    ! Move to home position
    MoveJ home_pos, v_fast, z_coarse, welding_torch;
    
    ! Perform welding sequence
    FOR i FROM 1 TO 3 DO
        weld_seam;
        
        ! Check for errors
        IF DInput(safety_stop) = 1 THEN
            ! Emergency stop activated
            Stop;
            RETURN;
        ENDIF
    ENDFOR
    
    ! Return to home
    MoveJ home_pos, v_fast, z_coarse, welding_torch;
    
    ! Shutdown welding system
    welding_shutdown;
ENDPROC

! Welding procedure
PROC weld_seam()
    ! Approach weld start position
    MoveJ Offs(weld_start, 0, 0, 50), v_med, z_coarse, welding_torch;
    MoveL weld_start, v_slow, z_fine, welding_torch;
    
    ! Start welding
    SetDO arc_on, 1;
    WaitTime 0.5;
    
    ! Perform weld
    MoveL weld_end, v_slow, z_fine, welding_torch;
    
    ! Stop welding
    SetDO arc_on, 0;
    WaitTime 0.2;
    
    ! Retract
    MoveL Offs(weld_end, 0, 0, 50), v_med, z_coarse, welding_torch;
ENDPROC

! Initialize welding system
PROC welding_init()
    ! Set welding parameters
    SetDO gas_flow, 1;
    SetDO wire_feed, 1;
    WaitTime 1.0;
ENDPROC

! Shutdown welding system
PROC welding_shutdown()
    ! Turn off welding equipment
    SetDO arc_on, 0;
    SetDO gas_flow, 0;
    SetDO wire_feed, 0;
ENDPROC

ENDMODULE