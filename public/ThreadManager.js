/**
 * @typedef {Object} Thread
 * @property {Array<Instance>} instances
 * @property {IPCRendererProcess} process
 * @property {string} pid
 * @property {Memory} mem 
 */

/**
 * @typedef {Object} Memory
 * @property {number} rss 
 * @property {number} heapTotal 
 * @property {number} heapUsed
 * @property {number} external
 */

/**
 * @class - ThreadManager
 * @classdesc - ThreadManager class managers all the different processes PI has to offer. 
 */

class ThreadManager {
    /**
     * @constructor
     * @param {Arrray<Threads>} threads 
     */
    constructor(threads){
        this.threads = threads;
    }

    /**
     * @function startProcesses
     * @description - Loops through threads and sends out a start command depending on position. 
     * Positions 0 and 1 are dedicated to Analytics and Diagnostics Servers. Any further positions are
     * dedicated to controls servers
     */
    startProcesses(){
        for(let i = 0; i < this.threads.length; i++){
            if(i == 0){
                this.startProcess(this.threads[i].process, "start-diagnostics");
            }else if(i == 1){
                this.startProcess(this.threads[i].process, "start-analytics")
            }else{
                this.startProcess(this.threads[i].process, "start-instance", this.threads[i].instances);
            }
        }
    }
    /**
     * @function
     * @param {IPCRendererProcess} process 
     * @param {string} event 
     * @param {Array<Instance>} instances
     * @description - Sends event command and required instances to given process 
     */
    startProcess(process, event, instances){
        if(!Array.isArray(instances)){
            process.send(event);
            process.send("get-info");
        }else{
            for(let instance of instances){
                process.send(event, {instance})
                
            }
            process.send("get-info")
        }
    }
    /**
     * @fucntion endProcesses
     * @description - Ends processes safely
     */
    endProcesses(){
        for(let thread of this.threads){
            this.endProcess(thread.process);
        }
    }
    /**
     * @function endProcess
     * @param {IPCRendererProcess} process 
     * @description - Initiates the close event on the process
     */
    endProcess(process){
        process.send("close");
    }
    /**
     * @function refreshProcess
     * @param {number} pid 
     * @description - Runs through threads and restarts the services with the given process id
     */
    refreshProcess(pid){
        let thread = this.threads.find(runningThread=>{
            return runningThread.pid == pid
        })

        this.endProcess(thread.process);
        if(thread.instances == "diagnostics"){
            this.startProcess(thread.process, "start-diagnostics")
        }else if (thread.instances == "analytics"){
            this.startProcess(thread.process, "start-analytics")
        }else{
            this.startProcess(thread.process, "start-instance", thread.instances, null)
        }
        
        this.summary();
    }

    /**
     * @function summary
     * @description - Loops through threads and gets the summary for memory usage
     */
    summary(){
        for(let thread of this.threads){
            this.getProcessInfo(thread.process);
        }
    }

    /**
     * @function getProcessInfo
     * @param {IPCRendererProcess} process
     * @description - Sends command to thread to get memory usage 
     */
    getProcessInfo(process){
        process.send("get-info");
    }

    /**
     * @function updateThreadInfo
     * @param {number} pid 
     * @param {Thread} thread 
     * @description - On a change to the thread, updates the thread.
     */
    updateThreadInfo(pid, thread){
        let oldThreadIndex = this.threads.findIndex(managedThread=>{
            return managedThread.pid == pid
        });
        if(oldThreadIndex != null){
            this.threads[oldThreadIndex] = thread;
        }  

        
    }
    /**
     * @function updateThreads
     * @param {Array<Thread>} threads 
     * @description - Replaces the threads in the ThreadManager with new threads.
     */
    updateThreads(threads){
        this.threads = threads;
    }

}

module.exports = ThreadManager