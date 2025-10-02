/PROG sample_fanuc_assembly
/ATTR
OWNER     = MNEDITOR;
COMMENT   = "Sample FANUC assembly program";
PROG_SIZE = 2048;
CREATE    = DATE 24-10-02  TIME 13:15:00;
MODIFIED  = DATE 24-10-02  TIME 13:15:00;
FILE_NAME = ASSEMBLY;
VERSION   = 0;
LINE_COUNT = 45;
MEMORY_SIZE = 1024;
PROTECT   = READ_write;
TCD:  STACK_SIZE = 0,
      TASK_PRIORITY = 50,
      TIME_SLICE = 0,
      BUSY_LAMP_OFF = 0,
      ABORT_REQUEST = 0,
      PAUSE_REQUEST = 0;
DEFAULT_GROUP = 1,*,*,*,*;
/MN
   1:  !Sample FANUC robot program ;
   2:  !for assembly operation ;
   3:  ;
   4:  !Initialize position registers ;
   5:  PR[1,1:home_pos]=600.000mm ;
   6:  PR[1,2:home_pos]=0.000mm ;
   7:  PR[1,3:home_pos]=600.000mm ;
   8:  PR[1,4:home_pos]=0.000deg ;
   9:  PR[1,5:home_pos]=0.000deg ;
  10:  PR[1,6:home_pos]=0.000deg ;
  11:  ;
  12:  PR[2,1:pick_pos]=400.000mm ;
  13:  PR[2,2:pick_pos]=200.000mm ;
  14:  PR[2,3:pick_pos]=150.000mm ;
  15:  PR[2,4:pick_pos]=0.000deg ;
  16:  PR[2,5:pick_pos]=90.000deg ;
  17:  PR[2,6:pick_pos]=0.000deg ;
  18:  ;
  19:  !Main assembly sequence ;
  20:  FOR R[10]=1 TO 5 ;
  21:    !Move to home position ;
  22:    J PR[1:home_pos] 100% FINE ;
  23:    ;
  24:    !Move to pick position ;
  25:    J PR[2:pick_pos] 50% FINE ;
  26:    ;
  27:    !Approach with linear motion ;
  28:    L PR[2:pick_pos] 100mm/sec FINE ;
  29:    ;
  30:    !Close gripper ;
  31:    DO[1:gripper]=ON ;
  32:    WAIT 0.50(sec) ;
  33:    ;
  34:    !Check part presence ;
  35:    IF DI[10:part_sensor]=ON,JMP LBL[100] ;
  36:    ;
  37:    !Part not detected - alarm ;
  38:    UALM[1] ;
  39:    PAUSE ;
  40:    ;
  41:    !Continue with assembly ;
  42:  LBL[100] ;
  43:    !Lift part ;
  44:    L PR[2:pick_pos]+Z[50mm] 200mm/sec FINE ;
  45:    ;
  46:    !Move to assembly position ;
  47:    J PR[3:assembly_pos] 75% CNT50 ;
  48:    L PR[3:assembly_pos] 50mm/sec FINE ;
  49:    ;
  50:    !Insert part ;
  51:    L PR[3:assembly_pos]+Z[-10mm] 10mm/sec FINE ;
  52:    ;
  53:    !Open gripper ;
  54:    DO[1:gripper]=OFF ;
  55:    WAIT 0.30(sec) ;
  56:    ;
  57:    !Retract ;
  58:    L PR[3:assembly_pos]+Z[30mm] 100mm/sec FINE ;
  59:    ;
  60:    !Check safety inputs ;
  61:    IF DI[20:e_stop]=ON,PAUSE ;
  62:    ;
  63:  ENDFOR ;
  64:  ;
  65:  !Return home ;
  66:  J PR[1:home_pos] 100% FINE ;
  67:  ;
/POS
/END